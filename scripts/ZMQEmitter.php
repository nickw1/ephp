<?php

require_once('MultiUserEmitter.php');

class ZMQEmitter extends MultiUserEmitter {

    public function __construct($host, $port) {
        $context = new ZMQContext();
        $this->socket = $context->getSocket(ZMQ::SOCKET_PUSH,'my pusher');
        $this->socket->connect("tcp://{$host}:{$port}");
    }

    public function emit($data) {
		$data1 = $this->addUserToData($data);
        $this->socket->send(json_encode($data1));
    }

    public function emitError($msg) {
        $this->socket->send(json_encode(["error"=>$msg]));
    }
}

?>
