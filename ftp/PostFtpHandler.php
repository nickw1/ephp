<?php

require_once('../defines.php');
require_once(LIBDIR."/FileUploader.php");
require_once('ReadWriteFtpHandler.php');

session_start();

class PostFtpHandler extends ReadWriteFtpHandler {

	const CANT_OPEN_TMP_FILE = 515;

	private $tmpname, $filename, $src;

	public function __construct ($server, $src, $filename) {
		parent::__construct($server);
		$this->src = $src;
		$this->filename = $filename;
	}

	public function getTmpName() {
		$this->tmpname =  tempnam("/tmp", $_SESSION["ephpuser"]);
		return $this->tmpname;
	}

	public function getName() {
		return $this->filename;
	}

	public function specifics() {
		$fp = fopen($this->tmpname, "w");
		return file_put_contents($this->tmpname, $this->src) === false ?
			PostFtpHandler::CANT_OPEN_TMP_FILE : 0;
	}	
}

?>
