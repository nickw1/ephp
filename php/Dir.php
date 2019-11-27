<?php

class Dir
{
    private $dir;
    public function __construct ($dir)
    {
        if(is_dir($dir))
            $this->dir = $dir;
    }

    public function toJSON($doType=false)
    {
        $json = array();
        if(isset($this->dir))
        {
            $files = scandir($this->dir);
            foreach($files as $file)
                if($file!=".")
                    $json[] = $doType ? (array("name"=>$file, 
						"dir"=>is_dir($this->dir."/".$file)?"1":"0")) : $file;
        }
        return $json;
    }
}
?>
