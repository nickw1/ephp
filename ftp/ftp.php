<?php

require_once('FileUploadFtpHandler.php');
require_once('PostFtpHandler.php');

session_start();


$u = isset($_POST["username"]) ? $_POST["username"] :
		(isset($_SESSION["ephpuser"]) ? $_SESSION["ephpuser"]: null);
$p = isset($_POST["password"]) ? $_POST["password"] :
		(isset($_SESSION["ephppass"]) ? $_SESSION["ephppass"]: null);

if(isset($_FILES["file"])) {
	$ftp = new FileUploadFtpHandler(EPHP_HOSTNAME,
				new FileUploader("file",1048576));
} else {
	$ftp = new PostFtpHandler(EPHP_HOSTNAME, $_POST["src"], $_POST["filename"]);
}

header("Content-type: application/json");
echo json_encode(array("status"=> $ftp->uploadAndFtp($u, $p),
					   "loggedin"=>$_SESSION["ephpuser"]));
?>
