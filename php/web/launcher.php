<?php

// launcher.php

define('TMPDIR','/var/www/tmp/');
define('SCRIPTDIR','/var/www/scripts/');

session_start();

//$user = $_SESSION["username"];
//$script = $_POST["script"];
$user = "ephp001";
$cmd = (isset($_POST["cmd"]) && $_POST["cmd"]=="stop") ? "stop":"";


if(preg_match("/^ephp\d{3}$/", $user)) {

    $scripts = ["wsocksrv", "xdclient"];

    foreach($scripts as $script) {
		
        $cmd1="/usr/bin/php ".SCRIPTDIR."{$script}.php $cmd > ".
                TMPDIR."{$script}_out.txt &";
		system($cmd1);
        usleep(500000);
    }
}
?>
