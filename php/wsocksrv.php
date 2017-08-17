<?php

require('vendor/autoload.php');

define('TMPDIR','/var/www/tmp/');
define('LOCKFILE', TMPDIR."wsocksrv.lock");

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

$xdupdateport = 9001;

class MessageHandler implements MessageComponentInterface {

    private $clientIDs, $clients, $lastActivity, $idleTimeout;

    public function __construct($it=1800) {
        $this->clientIDs = [];
        $this->clients = [];
        $this->idleTimeout = $it;
        $this->lastActivity = time();
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients[$conn->resourceId] = $conn;
        $this->lastActivity = time();
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $this->lastActivity = time();
        $data=json_decode($msg);
        if($data!==null) {
            switch($data->cmd) {
                case "user":
                    $this->clientIDs[$data->data] = $from->resourceId;;
                    $from->send(json_encode(["started"=>"1"]));
                    break;
            }
        }
    }

    public function onClose(ConnectionInterface $conn) {
        unset($this->clients[$conn->resourceId]);
    }

    public function onError(ConnectionInterface $conn,\Exception $e) {
        echo "error: {$e->getMessage()}\n";
    }
    public function onDbgMsg($json) {
        $data = json_decode($json);    
        if(isset($data->error)) {
        } elseif(isset($data->cmd)) {
            switch($data->cmd) {
                case "line":
                case "newrow":
                    if(isset($this->clients[$this->clientIDs[$data->user]])) {
                        $this->clients[$this->clientIDs[$data->user]]->
                            send(json_encode($data->data));
                    }
                    break;
            }
        }
    }

    public function isLongTermIdle() {
        return time() - $this->lastActivity >= $this->idleTimeout;
    }
}

if(@symlink("/proc/".getmypid(),LOCKFILE)!==false) {
    $wshandler = new MessageHandler();
    $loop = React\EventLoop\Factory::create();
    $loop->addPeriodicTimer(10, function() use($wshandler, $loop) {
        if($wshandler->isLongTermIdle()) {
            $loop->stop();
            unlink(LOCKFILE);
            echo json_encode(["status"=>"idlestop"]); 
        }
    });
    
    $zmqctx = new React\ZMQ\Context($loop); 
    $pull = $zmqctx->getSocket(ZMQ::SOCKET_PULL);
    $pull->bind("tcp://127.0.0.1:$xdupdateport");
    // Stop messages stop the loop; all others are forwarded to the 
    // websocket server
    $pull->on('message',function($msg) use($loop, $wshandler) {
        if($msg=="STOP") {
            $loop->stop();
            unlink(LOCKFILE);
            echo "STOP"; 
        } else {
            $wshandler->onDbgMsg($msg);
        }
    }); 
    

    $reactSockServ = new React\Socket\Server($loop);
    $reactSockServ->listen(8080, '0.0.0.0');
    

    $wsserver = new IoServer(new HttpServer(new WsServer($wshandler)), 
            $reactSockServ);
    $loop->run();
} elseif(count($argv)>1 && $argv[1]=="stop") {
    $context = new ZMQContext();
    $socket = $context->getSocket(ZMQ::SOCKET_PUSH,'my pusher');
    $socket->connect("tcp://127.0.0.1:$xdupdateport");
    $socket->send("STOP");
} else {
    echo json_encode(["status"=>"ignored"]);
}

?>
