<?php

require('vendor/autoload.php');

define('TMPDIR','/home/nick/tmp/');
define('LOCKFILE', TMPDIR."wsocksrv.lock");

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

class MessageHandler implements MessageComponentInterface {

    private $clientIDs, $clients;

    public function __construct() {
        $this->clientIDs = [];
        $this->clients = [];
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients[$conn->resourceId] = $conn;
        echo "connection! {$conn->resourceId}\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        echo "message: $msg resourceid: {$from->resourceId}\n";
        $data=json_decode($msg);
        if($data!==null) {
            switch($data->cmd) {
                case "user":
                    $this->clientIDs[$data->data] = $from->resourceId;;
                    $from->send ("User {$data->data} connected");
                    $from->send(json_encode(["started"=>"1"]));
                    break;
                /*
                case "open":
                    $from->send("OPENED...");
                    break;
                */
            }
        }
    }

    public function onClose(ConnectionInterface $conn) {
        unset($this->clients[$conn->resourceId]);
        echo "onClose(){$conn->resourceId}\n";
    }

    public function onError(ConnectionInterface $conn,\Exception $e) {
        echo "error: {$e->getMessage()}\n";
    }
    public function onDbgMsg($json) {
        echo "dbg msg: $json\n";
        $data = json_decode($json);    
        if(isset($data->error)) {
        } elseif(isset($data->cmd)) {
            switch($data->cmd) {
                case "line":
                case "newrow":
                    echo "user {$data->user} sent the debug message ".
                            json_encode($data->data).
                            " and corresponding resouce id is ".    
                            $this->clientIDs[$data->user]."\n";
                    if(isset($this->clients[$this->clientIDs[$data->user]])) {
                        $this->clients[$this->clientIDs[$data->user]]->
                            send(json_encode($data->data));
                    }
                    break;
            }
        }
    }
}

register_shutdown_function('unlink',LOCKFILE);
if(@symlink("/proc/".getmypid(),LOCKFILE)!==false) {
    $wshandler = new MessageHandler();
    $loop = React\EventLoop\Factory::create();
    $zmqctx = new React\ZMQ\Context($loop);
    $pull = $zmqctx->getSocket(ZMQ::SOCKET_PULL);
    $pull->bind('tcp://127.0.0.1:9001');
    $pull->on('message',array($wshandler,'onDbgMsg'));
    //$server = IoServer::factory(new HttpServer(new WsServer($wshandler)), 8081);
    $reactSockServ = new React\Socket\Server($loop);
    $reactSockServ->listen(8082, '0.0.0.0');
    $wsserver = new IoServer(new HttpServer(new WsServer($wshandler)), 
            $reactSockServ);
    $loop->run();
} else {
    echo "wsocksrv already running";
}

?>
