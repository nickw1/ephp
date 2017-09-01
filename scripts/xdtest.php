<?php
$a = "Oasis";
echo $a."\n";
$conn=new PDO("mysql:host=localhost;dbname=ephp001", "ephp001", "huneecoh");
$result = $conn->query("SELECT * FROM hits WHERE artist='$a'");
echo $result->queryString."\n";
while($row = $result->fetch()) {
	echo "$row[song] $row[year]\n";
}
?>
