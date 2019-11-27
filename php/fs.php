<?php

// fs.php
// Filesystem controller

require_once("FSController.php");
require_once("WSView.php");

session_start();
$controller = new FSController(new WSView());
$controller->execute ($_SERVER["REQUEST_METHOD"], $_REQUEST);

?>

