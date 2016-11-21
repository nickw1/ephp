<?php

require_once('../defines.php');
require_once(DOCUMENT_ROOT."/lib/FileUploader.php");


abstract class FtpHandler {

	protected $server;

	const CANT_CONNECT = 512, INVALID_LOGIN = 1024,
		CANT_TRANSFER_FILE = 513, INVALID_EPHP_USERNAME = 1025,
		INVALID_FILENAME = 514;

	public function __construct ($server) {
		$this->server = $server;
		$this->config = json_decode(file_get_contents("../config.json"));
	}

	public function uploadAndFtp($u, $p) {
		
		$error = 0;

		if(!preg_match("/^".$this->config->ephproot."\d{3}$/",$u)) {
			return FtpHandler::INVALID_EPHP_USERNAME;
		}

		
		if($this->config->ftp==1) {
			$conn = ftp_connect($this->server);
			if($conn) {
				$loginstatus = @ftp_login ($conn, $u, $p);
				if($loginstatus) {
					if(!isset($_SESSION["ephpuser"])) { 
						$_SESSION["ephpuser"] = $u;
						$_SESSION["ephppass"] = $p;
					}
				
					$tmpname = $this->getTmpName(); 
					$filename = $this->getName();

					if (!preg_match("/^[\w-\.\/]+$/", $filename) ||
						strpos($filename,"../")!==false) {
						return FtpHandler::INVALID_FILENAME;
					} elseif (($error=$this->specifics()) == 0) {
						// 21/11/16 public_html not necessarily at root
						$uploadstatus = @ftp_put ($conn, 
    						"public_html/$filename", $tmpname, FTP_BINARY);
						return $uploadstatus ? 0:FtpHandler::CANT_TRANSFER_FILE;
					}
				}	else {
						return FtpHandler::INVALID_LOGIN;
				}  
			}else {
				return FtpHandler::CANT_CONNECT;
			}
		} else {
			$_SESSION["ephpuser"] = $u;
		}
		
		return 0;
	}

	public abstract function specifics();
	public abstract function getTmpName();
	public abstract function getName();
}


?>
