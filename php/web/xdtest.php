<?php
require_once('../../scripts/dbpass.php');
$a = "Oasis";
echo $a."\n";
$u = isset($_GET["u"]) ? $_GET["u"]:"ephp001";
if(preg_match("/^ephp\d{3}$/", $u)) {

    $conn=new PDO("mysql:host=localhost;dbname=$u",
                "$u", DBPASS);
    $result = $conn->query("SELECT * FROM hits WHERE artist='$a'");
    echo $result->queryString."\n";
    while($row = $result->fetch()) {
        echo "$row[song] $row[year]\n";
    }
}

?>
