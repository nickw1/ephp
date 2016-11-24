<?php

require_once('../defines.php');
require_once(DOCUMENT_ROOT."/lib/FileUploader.php");


class FtpHandler {

	protected $server, $conn, $loginstatus;

	const CANT_CONNECT = 512, INVALID_LOGIN = 1024,
		CANT_TRANSFER_FILE = 513, INVALID_EPHP_USERNAME = 1025,
		INVALID_FILENAME = 514;

	public function __construct ($server) {
		$this->server = $server;
		$this->config = json_decode(file_get_contents("../config.json"));
	}

	public function connect() {
		$this->conn = ftp_connect($this->server);
		return $this->conn ? 0: FtpHandler::CANT_CONNECT;
	}

	public function login ($u, $p) {
		if($this->conn) {
			if(!preg_match("/^".$this->config->ephproot."\d{3}$/",$u)) {
				return FtpHandler::INVALID_EPHP_USERNAME;
			} else {
				$this->loginstatus = @ftp_login($this->conn, $u, $p);
				if(!$this->loginstatus) {
					return FtpHandler::INVALID_LOGIN;
				} else if (!isset($_SESSION["ephpuser"])) {
					$_SESSION["ephpuser"] = $u;
					$_SESSION["ephppass"] = $p;
					return 0;	
				}
			}
		} else {
			return FtpHandler::CANT_CONNECT;
		}
	}

	public function downloadFtp($filename) {
		if($this->config->ftp==1) {
			if($this->loginstatus) {	
				$tmpname = tempnam("/tmp", $_SESSION["ephpuser"]."_dl_");
				chmod($tmpname, 0644);
				if(@ftp_get($this->conn, $tmpname, "public_html/$filename", 
					FTP_BINARY)) {
					$contents =  file_get_contents($tmpname);
					unlink($tmpname);
					return $contents;
				} else {
					return FtpHandler::CANT_TRANSFER_FILE;
				}
			} else {
				return FtpHandler::INVALID_LOGIN;
			}
		}
		return "";
	}
}


?>
