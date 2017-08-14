<?php
require_once('dbpass.php');
$a = "Oasis";
$b = $_GET["title"];
echo $a."\n";
$u = $_GET["u"];
if(preg_match("/^ephp{\d}3$/", $u)) {

    $conn=new PDO("mysql:host=localhost;dbname=$u",
                "$u", DBPASS);
    $result = $conn->query("SELECT * FROM hits WHERE artist='$a'");
    echo $result->queryString."\n";
    while($row = $result->fetch()) {
        echo "$row[song] $row[year]\n";
    }
}

?>
