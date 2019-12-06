<?php

require_once('../defines.php');
require_once(LIBDIR."/FileUploader.php");
require_once('FtpHandler.php');


abstract class ReadWriteFtpHandler extends FtpHandler {

    public function __construct ($server) {
        parent::__construct($server);
    }

    public function uploadAndFtp() {
        if($this->config->ftp==1) {
            if($this->loginstatus) {
                $tmpname = $this->getTmpName(); 
                $filename = $this->getName();

                if (!preg_match("/^[\w-\.\/]+$/", $filename) ||
                        strpos($filename,"../")!==false) {
                    return FtpHandler::INVALID_FILENAME;
                } elseif (($error=$this->specifics()) == 0) {
                    // 21/11/16 public_html not necessarily at root
                    $uploadstatus = @ftp_put ($this->conn, 
                            "public_html/$filename", $tmpname, FTP_BINARY);
                    return $uploadstatus ? 0:FtpHandler::CANT_TRANSFER_FILE;
                }
            } else {
                return FtpHandler::INVALID_LOGIN;
            }  
        } else {
            $this->noFtpUpload();
        }
        
        return 0;
    }

    public abstract function specifics();
    public abstract function getTmpName();
    public abstract function getName();
    public abstract function noFtpUpload();
}


?>
