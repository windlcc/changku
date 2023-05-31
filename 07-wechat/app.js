var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server)
//连接数据库
var mysql = require('mysql');
var connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'20031210',
    database:'test'
})
//记录登录过的用户
const users=[]
server.listen(3000,()=>{
    console.log('服务器启动成功了')
});
app.use(require('express').static('public'))

app.get('/',function(req,res){
    res.redirect('/index.html')
})

io.on('connection', function (socket) {
 
    socket.on('login',data=>{
       //【判断
    let user=   users.find(item=>item.username===data.username)
  
    if(user){
   //存在
   socket.emit('loginError',{msg:'登录失败，用户名已存在'})
   return 
  
    }
    select_user(data,result=>{
        if(result.length){
          if(result[0].password != data.password){
            socket.emit('loginFail','密码错误!');
            return ;
          }
        }
users.push(data)
socket.emit('loginSuccess',data)
//io.emit广播信息
io.emit('addUser',data)
//用户列表
io.emit('userList',users)
socket.username=data.username
socket.avatar=data.avatar
    })
})
socket.on('registerUser', data => {
  select_user(data,result=>{
  if(result.length){
    if(result[0].username != data.username){
      socket.emit('registerError')
      return ;
    }
  }
insert_user(data)
users.push(data)
socket.emit('loginSuccess',data)
//io.emit广播信息
io.emit('addUser',data)
//用户列表
io.emit('userList',users)
socket.username=data.username
socket.avatar=data.avatar
})

})
    socket.on('disconnect',()=>{
        //把当前用户的信息删除，并告诉所有人有人离开聊天室
    let idx=users.findIndex(item=>item.username===socket.username)
    users.splice(idx,1)
    io.emit('delUser',{
        username:socket.username,
        avatar:socket.avatar
    })
    io.emit('userList',users)
    })
    //监听聊天的消息
    socket.on('sendMessage',data=>{
        console.log(data)
        //广播给所有用户
        io.emit('receiveMessage',data)
            //把接手的消息显示到聊天窗口中
    })
    //接收图片信息
    socket.on('sendImage',data=>{
        //广播给所有用户
        io.emit('receiveImage',data)
    })
})
function select_user(data,callback){
    //连接数据库开始查询
    let sql = 'SELECT * FROM user where id = \''+data.username+'\';';
    connection.query(sql,function (err, result) {
      if(err){
        console.log('[SELECT ERROR] - ',err.message);
        callback(null)
      }
      //用回调函数告诉调用者执行完了
      callback(result);
    });
  }
  //插入数据库
  function insert_user(data){
    let sql ='INSERT INTO user VALUES (\''+data.username+'\',\''+data.password+'\');';
    connection.query(sql,(err,result)=>{
      if(err){
        console.log('[INSERT ERROR] - ',err.message);
        return;
      };
    });
  }
  