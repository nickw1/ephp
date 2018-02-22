<?php

require_once('MultiUserEmitter.php');

class SSockEmitter extends MultiUserEmitter {

	private $ssocket;
    public function __construct($host, $port) {
		$this->ssocket = stream_socket_client("tcp://{$host}:{$port}",
			$errno, $errmsg);

    }

    public function emit($data) {
		fwrite($this->ssocket,json_encode($this->addUserToData($data)));
    }

    public function emitError($msg) {
		fwrite($this->ssocket,json_encode(["error"=>$msg]));
    }
}

?>
