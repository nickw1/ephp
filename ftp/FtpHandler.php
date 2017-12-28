<?php

require_once('../defines.php');
require_once(LIBDIR."/FileUploader.php");


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
        if($this->config->ftp==1) {
            $this->conn = ftp_connect($this->server);
        } else {
            $this->conn = new PDO("mysql:host=localhost;dbname=".USER_DB,
                        USER_DB_USER, USER_DB_PASS);
        }
        return $this->conn ? 0: FtpHandler::CANT_CONNECT;
    }

    public function login ($u, $p) {
        if($this->conn) {
            if(!preg_match("/^".$this->config->ephproot."\d{3}$/",$u)) {
                return FtpHandler::INVALID_EPHP_USERNAME;
            } elseif($this->config->ftp==1) {
                $this->loginstatus = @ftp_login($this->conn, $u, $p);
                if(!$this->loginstatus) {
                    return FtpHandler::INVALID_LOGIN;
                } else if (!isset($_SESSION["ephpuser"])) {
                    $_SESSION["ephpuser"] = $u;
                    $_SESSION["ephppass"] = $p;
                    return 0;    
                }
            } else {
                $stmt = $this->conn->prepare
                    ("SELECT * FROM ephpusers WHERE username=? AND ".
                        "password=?");
                $stmt->bindParam(1, $u);
                $stmt->bindParam(2, $p);
                $stmt->execute();
                
                if(($row = $stmt->fetch())!==false) {
                    $_SESSION["ephpuser"] = $u;
                    $_SESSION["ephppass"] = $p;
                    $this->loginstatus = true;
                    return 0;
                } else {
                    return FtpHandler::INVALID_LOGIN;
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
        } else {
            $contents = file_get_contents(WEBROOT."/".NOFTP_USER_ROOT.
                "/".$_SESSION["ephpuser"]."/".$filename);
            return $contents;
        }
    }

    public function delete($files) {
        if($this->config->ftp==1) {
            if($this->loginstatus) {
                $failures = [];
                foreach($files as $file) {
                    if (!preg_match("/^[\w-\.\/]+$/", $file) ||
                            strpos($file,"../")!==false|| 
                        !@ftp_delete($this->conn, "public_html/$file")){
                        $failures[] = $file;
                    }
                }
                return $failures;
            } else {
                return FtpHandler::INVALID_LOGIN;
            }
        } else {
            foreach($files as $file) {
                unlink(WEBROOT."/".NOFTP_USER_ROOT."/".
                    $_SESSION["ephpuser"]."/".$file);
            }
        }
        return "";    
    }
}


?>
