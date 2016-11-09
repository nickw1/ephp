<?php

require_once('../defines.php');
require_once(DOCUMENT_ROOT."/lib/FileUploader.php");
require_once('FtpHandler.php');


class FileUploadFtpHandler extends FtpHandler {

	private $uploader;

	public function __construct ($server, FileUploader $uploader) {
		parent::__construct($server);
		$this->uploader = $uploader;
	}

	public function getTmpName() {
		return $this->uploader->getTmpName();
	}

	public function getName() {
		return $this->uploader->getName();
	}

	public function specifics() {
		$error = $this->uploader->getError();

		if(!$this->uploader->isUploadedFile()) {
			$error = FileUploader::SECURITY_VIOLATION; 
		}
		elseif(!$this->uploader->sizeOk()) {
			$error = FileUploader::EXCEEDED_FILESIZE;
		}
		return $error;
	}	
}

?>
