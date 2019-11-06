<?php

require_once('vendor/autoload.php');
use React\Socket\ConnectionInterface;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface as RConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;


require_once('../defines.php');
require_once('EPHPXD.php');
require_once(XDCLIENT_DIR.'/WebSockEmitter.php');
require_once(XDCLIENT_DIR.'/MultiUserEmitter.php');

use XDClient\MultiUserEmitter;

class WSockMsgHandler implements MessageComponentInterface, XDClient\WebSocketHandler {

    private $clientIDs, $clients;
    public function __construct() {
        $this->clients = [];
        $this->clientIDs = [];
    }

    public function onOpen(RConnectionInterface $conn) {
        $this->clients[$conn->resourceId] = $conn;
    }

    public function onMessage(RConnectionInterface $from, $msg) {
        $data = json_decode($msg);
        if($data!==null && isset($data->cmd)) {
            switch($data->cmd) {
                case "user":
                    echo "Setting clientIDs entry {$data->data} to {$from->resourceId}\n";
                    $this->clientIDs[$data->data] = $from->resourceId;
                    $from->send(json_encode(["cmd"=>"opened","user"=>$data->data]));
                    break;
            }
        }
    }

    public function onClose(RConnectionInterface $conn) {
        unset($this->clients[$conn->resourceId]);
    }

    public function onError(RConnectionInterface $conn,\Exception $e) {
        echo "error: {$e->getMessage()}\n";
    }

    public function pushMsg($json) {
        echo "Trying to push a message: $json\n";
        $data = json_decode($json);
        if(isset($data->error)) {
            // TODO...
        } elseif(isset($data->cmd)) {
            echo "Command {$data->cmd}\n";
            if($this->clients[$this->clientIDs[$data->user]]) {
                echo "Pushing message on clientID {$this->clientIDs[$data->user]} which corresponds to {$data->user}\n";
                $this->clients[$this->clientIDs[$data->user]]->send($json);
            }
        }
    }
}

$loop = React\EventLoop\Factory::create();
$dbgpSock = new React\Socket\Server('0.0.0.0:9000', $loop);
$wshandler = new WSockMsgHandler();
$xdProcessor = new EPHPXD(new MultiUserEmitter($wshandler));

$dbgpSock->on('connection', function(ConnectionInterface $connection) use ($wshandler, $xdProcessor) {
    echo "Got a connection\n";
    $connection->on('data', function($data) use ($connection, $wshandler, $xdProcessor) {
        $datas = explode("\0", $data);
        if(count($datas)>=2) {
            for($i=1; $i<count($datas); $i+=2) {
                if (!$xdProcessor->processData($connection, $datas[$i])) {
                    $connection->close();
                    break;
                }
            }
        }
    });

    $connection->on('end', function() {
        echo "Connection ended\n";
    });

    $connection->on('close', function() {
        echo "Connection closed\n";
    });

    $connection->on('error', function(Exception $e) {
        echo "Error {$e->getMessage()}\n";
    });
});

$wsocksrv = new React\Socket\Server('0.0.0.0:8080', $loop);
$wsIoServer = new IoServer(new HttpServer(new WsServer($wshandler)), 
            $wsocksrv, $loop);
$loop->run();
?>
