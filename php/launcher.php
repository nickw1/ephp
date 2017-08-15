<?php

// launcher.php

define('TMPDIR','/home/nick/tmp/');

session_start();

//$user = $_SESSION["username"];
//$script = $_POST["script"];
$user = "ephp001";


if(preg_match("/^ephp\d{3}$/", $user)) {

    $scripts = ["wsocksrv", "xdclient"];

    foreach($scripts as $script) {
        system("php /home/nick/ephp/php/{$script}.php > ".
                TMPDIR."{$script}_out.txt &");
        sleep(1);
    }
}
?>
