<?php

require_once("Dir.php");
require_once("../defines.php");

class FSController
{
    private $view, $user, $config;

    public function __construct ($view)
    {
        $this->view = $view;
        $this->config = json_decode(file_get_contents("../config.json"));
    }

    public function execute($method, $httpdata)
    {
        $code = 200;
        $json = array();
        $output=true;
        if(isset($_SESSION["ephpuser"]))
        {
            $webdir = $this->config->ftp==1 ?
                HOME_DIR."/".$_SESSION["ephpuser"]."/".USER_WEB_DIR:
                WEBROOT."/".NOFTP_USER_ROOT."/".$_SESSION["ephpuser"];
                
            $webdirUrl = $this->config->ftp==1 ?
                "/~".$_SESSION["ephpuser"]."/":
                "/".NOFTP_USER_ROOT."/".$_SESSION["ephpuser"]."/";

            if($method=="GET")
            {
                if(isset($httpdata["dir"])     && 
                    preg_match("/^\.?[\w\/]*$/", $httpdata["dir"]))
                {
                    if(isset($httpdata["file"]) &&
                        preg_match("/^[\w-\.]+$/", $httpdata["file"]))
                    {
                        $file=$webdir."/".$httpdata["dir"].
                            "/".$httpdata["file"];
                        if(file_exists($file))
                        {
                            $ext = pathinfo($file,PATHINFO_EXTENSION);
                            $contents = file_get_contents($file);
                            header("Content-type: application/json");
                            echo json_encode(["webdirUrl"=>$webdirUrl,
                                            "contentType"=>"text/html",
                                            "content"=>$contents]);    
                            $output=false;
                        }
                        else
                        {
                            $code = 404;
                            $json["errors"][] ="File not found";    
                        }
                    }
                    else
                    {
                        $json["dir"] = $webdir."/".$httpdata["dir"];
                        $dir = new Dir ($webdir."/".$httpdata["dir"]);
                        $json["content"] = $dir->toJSON(true);
                    }
                }
                else
                {
                    $code = 400;
                    $json["errors"][] = "Invalid directory format";
                }
            } 
        }
        else
        {
            $code = 401;
            $json["errors"][] = "Not logged in";
        }
        if($output)
            $this->view->outputJSON($json, $code);
    }
}
