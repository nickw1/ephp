<?php

require_once('../defines.php');
session_start();

class Backup { 

	private $file, $user;

	public function __construct($user) {
		$this->user = $user;
	}

	public function save($src, $filename) {
		$filename = ($filename=="" ? "unnamed": basename($filename));
		if(!is_dir(EPHP_BACKUP."/".$this->user)) {
			mkdir(EPHP_BACKUP."/".$this->user);
		}	
		$matches = glob(EPHP_BACKUP."/".$this->user."/*");
		if(count($matches) == 1) {
			$bk_filename = substr($matches[0],strrpos($matches[0],"/")+1);
			if($bk_filename != $filename) {
				unlink($matches[0]);
			}
		}
		file_put_contents(EPHP_BACKUP."/".$this->user."/".$filename, $src);
	}

	public function load() {
		$matches = glob(EPHP_BACKUP."/".$this->user."/*");
		if(count($matches)==1) {
			$filename = substr($matches[0],strrpos($matches[0],"/")+1);
			return array("src"=>file_get_contents($matches[0]),
						"filename"=>$filename=="unnamed" ? "":$filename);
		}
		return array("src"=>"","filename"=>"");
	}

	public function clear() {
	}
}

if(!isset($_SESSION["ephpuser"])) {
	header("HTTP/1.1 401 Unauthorized");
} else {

	$bkp = new Backup($_SESSION["ephpuser"]);

	switch($_SERVER["REQUEST_METHOD"]) {
		case "GET":
			header("Content-type: application/json");
			echo json_encode($bkp->load());
			break;

		case "POST":
			if(isset($_POST["src"])) {
				$bkp->save($_POST["src"], $_POST["filename"]);
			} elseif(isset($_POST["delete"])) {
				$bkp->clear();
			}
			break;
	}
}
?>
