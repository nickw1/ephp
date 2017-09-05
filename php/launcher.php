<?php

// launcher.php

define('TMPDIR','/var/www/tmp/');
define('SCRIPTDIR','/var/www/_scripts/');

session_start();

//$user = $_SESSION["username"];
//$script = $_POST["script"];

$_SESSION["ephpuser"] = "ephp001";

$user = null;

if(isset($_SESSION["ephpuser"]) &&
		preg_match("/^ephp\d{3}$/", $_SESSION["ephpuser"])) {

	$cmd = (isset($_POST["cmd"]) && $_POST["cmd"]=="stop") ? "stop":
			(isset($argv[1]) && $argv[1]=="stop" ? "stop":"");

	$stopping = $cmd=="stop";
    $scripts = ["wsocksrv", "xdclient"];

    for($i=($stopping ? count($scripts)-1 : 0); 
		$i!=($stopping ?  -1: count($scripts));
		$i+=($stopping ? -1:1)) {
        $cmd1="/usr/bin/php ".SCRIPTDIR."{$scripts[$i]}.php $cmd > ".
                TMPDIR."{$scripts[$i]}_out.txt &";
		system($cmd1);
        usleep(500000);
    }
	$user = $_SESSION["ephpuser"];
}
echo json_encode(["user"=>$user]);
?>
