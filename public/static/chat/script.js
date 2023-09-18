if (getCookie("id") == "") {
    uuid = uuidv4()
    document.cookie = "id=" + uuid
    document.getElementById("id").value = uuid
} else {
    document.getElementById("id").value = getCookie("id");
}
const idSession = get(".id_session");
const USER_ID = document.getElementById("id").value;
idSession.textContent = USER_ID
getHistory()
var selectElement = document.getElementById("level");
var level = selectElement.value;
var polish_num = 400;
 selectElement.addEventListener("change", function() {
      level = selectElement.value;

});


const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");
const msgerSendBtn = get(".msger-send-btn");


// Icons made by Freepik from www.flaticon.com
const BOT_IMG = "/static/chat/chatgpt.svg";
const PERSON_IMG = "https://api.dicebear.com/5.x/micah/svg?seed=" + document.getElementById("id").value
const BOT_NAME = "AI";
const PERSON_NAME = "You";

// Function to delete chat history records for a user ID using the API
function deleteChatHistory(userId) {
    if (!confirm("Are you sure? Your Session and History will delete for good.")) {
        return false
    }

    fetch('/chat.chat/delMsg?user=' + USER_ID, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'}
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error deleting chat history: ' + response.statusText);
            }
            deleteAllCookies()
            location.reload(); // Reload the page to update the chat history table
        })
        .catch(error => console.error(error));
}

// Event listener for the Delete button click
const deleteButton = document.querySelector('#delete-button');
deleteButton.addEventListener('click', event => {
    event.preventDefault();
    deleteChatHistory(USER_ID);
});

msgerForm.addEventListener("submit", event => {
    event.preventDefault();

    const msgText = msgerInput.value;
    if (!msgText) return;

    appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
    msgerInput.value = "";

    sendMsg(msgText)
});
//扩写回答内容
function expansion($id,$msg) {
    if( msgerSendBtn.disabled){return alert('请等待操作完成')}
    msgerSendBtn.disabled = true
   var formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('msgText', $msg);
    formData.append('level', level);
    formData.append('number', polish_num);
    fetch('/chat.chat/expansion', {method: 'POST', body: formData})
        .then(response => response.json())
        .then(ret => {
            console.log(ret)
                let content = ret.choices[0].message.content

                // console.log(ret.choices);
                // console.log(ret.choices[0]);

                ret = '<--扩写:' + $msg+ '--><hr>' + content;
                appendMessage(BOT_NAME, BOT_IMG, "left", ret, "",2);
            msgerSendBtn.disabled = false
        })
        .catch(error => function(){
             msgerSendBtn.disabled = false
            console.error(error)
        } );
}
//润色当前回答
function polish($id,$msg){
    if( msgerSendBtn.disabled){return alert('请等待操作完成')}
     msgerSendBtn.disabled = true
     var formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('msgText', $msg);
    formData.append('level', level);
    formData.append('number', polish_num);
    fetch('/chat.chat/polish', {method: 'POST', body: formData})
        .then(response => response.json())
        .then(ret => {
            console.log(ret)
                let content = ret.choices[0].message.content

                // console.log(ret.choices);
                // console.log(ret.choices[0]);

                ret = '<--润色:' + $msg+ '--><hr>' + content;
                appendMessage(BOT_NAME, BOT_IMG, "left", ret, "",2);
             msgerSendBtn.disabled = false
        })
        .catch(error => function(){
             msgerSendBtn.disabled = false
             console.error(error)
        } );
}
//提示
function hint($id,$msg){
    if( msgerSendBtn.disabled){return alert('请等待操作完成')}
     msgerSendBtn.disabled = true
      var formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('msgText', $msg);
    formData.append('level', level);
    fetch('/chat.chat/hint', {method: 'POST', body: formData})
        .then(response => response.json())
        .then(ret => {
            console.log(ret)
                let content = ret.choices[0].message.content

                // console.log(ret.choices);
                // console.log(ret.choices[0]);

                ret = '<--提示:' + $msg+ '--><hr>' + content;
                appendMessage(BOT_NAME, BOT_IMG, "left", ret, "",2);
             msgerSendBtn.disabled = false
        })
        .catch(error => function(){
            console.error(error)
             msgerSendBtn.disabled = false
        } );
}

function translate($id,$msg){
    if( msgerSendBtn.disabled){return alert('请等待操作完成')}
     msgerSendBtn.disabled = true
     var formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('msgText', $msg);
    formData.append('level', level);
    fetch('/chat.chat/translate', {method: 'POST', body: formData})
        .then(response => response.json())
        .then(ret => {
            console.log(ret)
                let content = ret.choices[0].message.content

                // console.log(ret.choices);
                // console.log(ret.choices[0]);

                ret = '<--翻译:' + $msg+ '--><hr>' + content;
                appendMessage(BOT_NAME, BOT_IMG, "left", ret, "",2);
             msgerSendBtn.disabled = false
        })
        .catch(error =>function(){
            console.error(error)
            msgerSendBtn.disabled = false
        } );
}

function getHistory() {
    var formData = new FormData();
    formData.append('user_id', USER_ID);
    fetch('/chat.chat/getMsg', {method: 'POST', body: formData})
        .then(response => response.json())
        .then(chatHistory => {
            for (const row of chatHistory) {
                appendMessage(PERSON_NAME, PERSON_IMG, "right", row.human);
                appendMessage(BOT_NAME, BOT_IMG, "left", row.ai, "");
            }
            if(!chatHistory ||  chatHistory.length < 1){
                sendMsg('开始')
            }
        })
        .catch(error => console.error(error));
}

function appendMessage(name, img, side, text, id,is_button ) {
 if(!is_button){is_button = 1}
    //   Simple solution for small apps
    let msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text" id=${id}>${text}</div>
      </div>`;

     if(is_button == 1){
          if(side == 'left'){
             msgHTML += `<br>
            <div class="msger-send-btn" clicktype='translate' >翻译</div>&nbsp;
            <div class="msger-send-btn" clicktype='hint''>提示</div>`;
            }else{
              msgHTML += `<br>
      
          <div class="msger-send-btn" clicktype='expansion'>扩写润色</div>`;
            }
     }
       //   <div class="msger-send-btn" clicktype='polish' >润色</div>&nbsp;



     msgHTML += `</div>`

    msgerChat.insertAdjacentHTML("beforeend", msgHTML);
    msgerChat.scrollTop += 500;

    msgerChat.onclick = function(event) {
        console.log(event)
        const siblingDivs = Array.from(event.target.parentNode.children);
        let msg = siblingDivs[1].children[1].innerText;
        let pid = event.target.getAttribute('p-id');
        let clicktype = event.target.getAttribute('clicktype');
        console.log(msg)
         // 获取兄弟 div 元素列表
        if(clicktype == 'translate'){
            translate(1,msg)

        }else if(clicktype == 'hint'){
             hint('',msg)
        }else if(clicktype == 'polish'){
             polish('',msg)
        }else if(clicktype == 'expansion'){
             expansion('',msg)
        }else{
            console.log('null');
        }
        // console.log(even)
        // const target = event.target;
        // alert(123)
    };
}

function sendMsg(msg) {
    msgerSendBtn.disabled = true
    var formData = new FormData();
    formData.append('msg', msg);
    formData.append('user_id', USER_ID);
    formData.append('level', level);
    fetch('/chat.chat/sendMsg', {method: 'POST', body: formData})
        .then(response => response.json())
        .then(data => {

            let uuid = uuidv4()
            const eventSource = new EventSource(`/chat.chat/eventStream?chat_history_id=${data.id}&id=${encodeURIComponent(USER_ID)}`);
            // const eventSource = new EventSource('http://198.23.236.235:7200/chat.chat/eventStream?chat_history_id=8&id=4123b645-e9e5-43f4-9a82-570b2bf3c1d2');
            appendMessage(BOT_NAME, BOT_IMG, "left", "", uuid);
            const div = document.getElementById(uuid);

            eventSource.onmessage = function (e) {
                if (e.data == "[DONE]") {
                    msgerSendBtn.disabled = false
                    eventSource.close();
                } else {
                    let txt = JSON.parse(e.data).choices[0].delta.content
                    if (txt !== undefined) {
                        div.innerHTML += txt.replace(/(?:\r\n|\r|\n)/g, '<br>');
                    }
                }
            };
            eventSource.onerror = function (e) {
                msgerSendBtn.disabled = false
                console.log(e);
                eventSource.close();
            };


        })
        .catch(error => console.error(error));


}

// Utils
function get(selector, root = document) {
    return root.querySelector(selector);
}

function formatDate(date) {
    const h = "0" + date.getHours();
    const m = "0" + date.getMinutes();

    return `${h.slice(-2)}:${m.slice(-2)}`;
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function showInputModal() {
    document.getElementById("inputModal").style.display = "flex";
}

function handleInput() {
    var input = document.getElementById("inputField").value;
    console.log("用户输入的内容是：" + input);
    polish_num = input
     // 清空输入框中的内容
//   document.getElementById("inputField").value = "";
    // 在这里可以对输入的内容进行处理
    document.getElementById("inputModal").style.display = "none";
}
function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function deleteAllCookies() {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}