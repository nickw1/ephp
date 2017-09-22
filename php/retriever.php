<?php

// heavily cut down version of original analysder.php
// simply retrieves a given php sxript source code, but checks that the
// current user owns the script
session_start();
header("Content-type: application/json");

$config = json_decode(file_get_contents("../config.json"), true);
$errors = array();


$target = $_SERVER["REQUEST_METHOD"]=="POST" ? $_POST["target"]:$_GET["target"];

$httpCode = 500;


if(!isset($_SESSION["ephpuser"])) {
    $errors[] = "Not logged in.";
}
elseif(($fileinfo=get_php_filename($target,$config["ephproot"]))==null) {
    $errors[] = "Can only read from ephp-designated directories.";
} else {
    list($expectedUsername, $targetfile) = $fileinfo;
    if($expectedUsername != $_SESSION["ephpuser"]) {
        $errors[] = "Cannot read another user's files.";
        $httpCode = 400;
    } else {
		if(($target_contents = @file_get_contents($targetfile))===false) {
			$errors[] = "Cannot open specified PHP file on server $targetfile.";
			$httpCode = 404;
		}
    } 
} 

if(empty($errors)) {
	$srclines = explode("\r\n", $target_contents);
    $json = array (
        //"php" => htmlentities($target_contents), 
        "src" => $srclines,
                ); 
        $httpCode = $script_result["status"]["code"];
} else { 
    $json = array ("errors" => $errors);
}


header("HTTP/1.1 $httpCode");
echo json_encode($json);

        

function get_php_filename($target, $ephproot)
{
    $matches=array();
    // can only get php files from specific ephp directories (sandbox)
    if(preg_match("/^\/~(${ephproot}\d{3})\/([a-zA-Z0-9_\/\-]+\.php)$/", 
        $target,$matches)) {
        return array ($matches[1],"/home/$matches[1]/public_html/$matches[2]");
    }
    return null;
}
?>
