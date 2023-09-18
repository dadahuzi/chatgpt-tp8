<?php

namespace app\controller;

use app\BaseController;

class Index extends BaseController
{
    public function index()
    {
        view('index');
    }

    /**
     * hello
     * @param string $name
     * @return string
     * @author cxf
     * @email: 2413067063@qq.com
     * @Time: 2023/7/12 10:35
     * @method POST
     *
     */
    public function hello($name = 'ThinkPHP8')
    {


        return 'hello,' . $name;
    }
}
