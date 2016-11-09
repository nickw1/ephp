<?php
class WSView
{
    public function output ($code, $msg)
    {
        header("HTTP/1.1 $code");
        echo $msg;
    }

    public function outputJSON ($data, $code=200)
    {
        if(!is_array($data))
        {
			$data = array ("errors" => array($data));
        }
		header("HTTP/1.1 $code");
		header("Content-type: application/json");
		echo json_encode($data);
    }

	public function outputFile ($file, $encode=true)
	{
		foreach($file as $line)
		{
			if(strstr($line,"ephp_count")===false)
			{
				echo $encode==true ? 
				htmlentities($line). "<br/>" :
				$line ;
			}
		}
	}
}
?>        
