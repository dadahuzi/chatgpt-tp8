<?php

namespace app\controller\chat;

use Orhanerday\OpenAi\OpenAi;
use think\cache\driver\Redis;
use think\facade\Db;
use think\facade\Env;
use think\facade\Log;
use think\facade\View;

const ROLE = "role";
const CONTENT = "content";
const USER = "user";
const SYS = "system";
const ASSISTANT = "assistant";
class ChatTest
{

    public $open_ai_key = "";

    public function index()
    {
        return View::fetch();
    }
    
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        $this->open_ai_key = Env::get('OPEN_AI_KEY');
    }


    /**
     * 聊天测试1
     * @throws \Exception
     * @author cxf
     * @email: 2413067063@qq.com
     * @Time: 2023/7/12 10:50
     * @method POST
     *
     */
    public function eventStream()
    {
        $id = request()->get('id');
        $chat_history_id = request()->get('chat_history_id');
        // Retrieve the data in ascending order by the id column
        $history = cache('chat' . $id);
        if (empty($history)) {
            $results = Db::table('chat_history')
                ->where('uid', $id)
                ->limit(0, 6)
                ->select()
                ->toArray();
            $history[] = [ROLE => SYS, CONTENT => "You are a helpful assistant. You can help me by answering my questions. You can also ask me questions."];
            foreach ($results as $key => $row) {

                $history[] = [ROLE => USER, CONTENT => $row['human']];
                if (!empty($row['ai'])) {
                    $history[] = [ROLE => ASSISTANT, CONTENT => $row['ai']];
                }

            }
            cache('chat' . $id, $history, ['expire' => 1800]);
        } else {
//            if(count($history) > 6){$}
            $msg = Db::table('chat_history')
                ->where('uid', $id)
                ->order('id', 'DESC')
                ->value('human');
            $history[] = [ROLE => USER, CONTENT => $msg];
        }
        $numaber = count($history);
        if ($numaber == 15) {
            $history = array_slice($history, 10, $numaber);
        }


        $open_ai = new OpenAi($this->open_ai_key);
//        Log::alert(json_encode($history, JSON_UNESCAPED_UNICODE));
        $opts = [
            'model' => 'gpt-3.5-turbo',
            'messages' => $history,
            'temperature' => 0.5,
            'max_tokens' => 600,
            'stream' => true
        ];
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        $txt = "";

        $complete = $open_ai->chat($opts, function ($curl_info, $data) use (&$txt) {
            if ($obj = json_decode($data) and $obj->error->message != "") {
                Log::error(json_encode($obj->error->message));
            } else {
                $clean = str_replace("data: ", "", $data);
                $arr = json_decode($clean, true);
                if ($data != "data: [DONE]\n\n" and isset($arr["choices"][0]["delta"]["content"])) {
                    $content = $arr["choices"][0]["delta"]["content"];
                    $txt .= $content;
                    $returnText = "data: {\"c\":\"{$content}\"}\n\n";
                    echo $returnText;
                } else {
                    if ($data == "data: [DONE]\n\n") {
                        $returnText = "data: [DONE]\n\n";
                    } else {
                        $returnText = "data: {\"c\":\"\"}\n\n";
                    }
                    echo $returnText;
                }

            }

            echo PHP_EOL;
            ob_flush();
            flush();
//            return strlen($data);
            return strlen($data);
        });
        $history[] = [ROLE => ASSISTANT, CONTENT => $txt];

        cache('chat' . $id, $history, ['expire' => 1800]);
        // Prepare the UPDATE statement
        Db::table('chat_history')
            ->where('id', $chat_history_id)
            ->update([
                'ai' => $txt
            ]);
    }

    public function sendMsg()
    {
        $uid = request()->post('user_id');
        $msg = request()->post('msg');
        // Bind the parameters and execute the statement for each row of data
        $row = ['uid' => $uid, 'human' => $msg, 'time' => time()];
        $ret = Db::table('chat_history')->where('uid', $uid)
            ->insertGetId(
                $row
            );
        header('Content-Type: application/json');
        $data = [
            "id" => $ret
        ];
        echo json_encode($data);
    }


    public function delMsg()
    {
        $user_id = $_GET['user'];
        $result = Db::table('chat_history')
            ->where('uid', $user_id)
            ->delete();
        http_response_code(204); // No Content
    }

    //获取消息
    public function getMsg()
    {

        $user_id = $_POST['user_id'];
        $result = Db::table('chat_history')
            ->where('uid', $user_id)
            ->order('id', 'ASC')
            ->limit(0, 10)
            ->select();

        // Fetch the results and store them in an array
        $chat_history = array();
        foreach ($result as $row) {
            $chat_history[] = $row;
        }

        // Set the HTTP response header to indicate that the response is JSON
        header('Content-Type: application/json');

        // Convert the chat history array to JSON and send it as the HTTP response body
        echo json_encode($chat_history);
    }

    //提示
    public function hint()
    {

        $msgText = $_POST['msgText'];

        $open_ai = new OpenAi($this->open_ai_key);
//        $history[] = [ROLE => SYS, CONTENT => "请以作为IELTS的专业角度, 为我回答雅思口语问题,尽量简单因为你的回答仅作为提示"];
        $history[] = [ROLE => SYS, CONTENT => "You are a professional IELTS assistant example: question: Good day! Let's start with the first question. Question 1: Can you tell me about your hometown? 6.5 Answer: Certainly! My hometown is a small city located in the northern part of the country. It is known for its rich cultural heritage and historical significance. The city is surrounded by picturesque landscapes, with mountains and rivers adding to its natural beauty. The people in my hometown are friendly and welcoming, making it a pleasant place to live. The local cuisine is also something to be cherished, with a variety of traditional dishes that are unique to the region. Overall, my hometown is a charming place that offers a blend of history, nature, and warm hospitality."];

        $history[] = [ROLE => USER, CONTENT => "Answer the following text and achieve an IELTS score of {$this->level}:" . $msgText];
        $opts = [
            'model' => 'gpt-3.5-turbo',
            'messages' => $history,
            'temperature' => 0.6,
            "max_tokens" => 500,
            "frequency_penalty" => 0,
            "presence_penalty" => 0.6,

        ];
        header('Content-Type: application/json');

        $chat = $open_ai->chat($opts);
        echo $chat;
//        $d = json_decode($chat);
//        echo($d->choices[0]->message->content);
    }

}