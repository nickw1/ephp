<?php

session_start();

require_once('defines.php');
require_once(LIBDIR.'/Page.php');

class EPHPPage extends Page {
    public function writeBody() {
        ?>
        <body onload='init()'>
        <h1>ephp<sup>ii</sup></h1>
        <div id="login">
        <?php
        if(isset($_SESSION["ephpuser"])) {
            echo "<p>Logged in as $_SESSION[ephpuser]";
            echo " <a href='ftp/logout.php'>Logout</a></p>";
        } else {
        ?>
        <form method="post" action="ftp.php">
        <label for="ephp_username">Username:</label>
        <input name="ephp_username" id="ephp_username" />
        <label for="ephp_password">Password:</label>
        <input name="ephp_password" id="ephp_password" type="password" />
        <input type="button" id="ftpsubmit" value="Go!" />
        </form>
        <?php
        }
        ?>

        <div style="display: none">
        <input id="dbshow" value="dbshow" type="button"/>
        <input id="dbhide" value="dbhide" type="button"/>
        </div>

        </div>



		<div id="ephp_container">

        <div id="client">
            <div id='client_header' class='component_header'>client<br />
                <img src='assets/images/computer-laptop.small.png'
                alt='client' id='client_img'/>
            </div>
            <div id='client_toolbar'>
                <img id='file_new' src='assets/images/page_add.2.png' 
                    alt='New file' title='New file' />
                <img id='file_save' src='assets/images/script_save.2.png'
                    alt='Save current file' title='Save current file' />
                <img id='file_upload' src='assets/images/arrow_right.2.png'
                    alt='Upload current file' title='Upload current file' />
            </div>
            <div id='filename'></div>
            <div id='src_ace'></div>
            <div id="content" ></div>
            <div id='client_footer'>
                <div id="client_tabs">
                    <span id="edit_tab">Develop</span>
                    <span id="sim_tab">Simulation</span>
                </div>
            </div>
        </div>

        <div id="network">
        <div id='network_header' class='component_header'>
        network<br />
            <img src='assets/images/rgtaylor_csc_net_wan_cloud.med.png'
                alt='network' id='network_img'/>
        </div>

        </div>

        <div id="server">
            <div id='server_header' class='component_header'>server<br />
                <img src='assets/images/web_server.small.png'
                alt='server' id='server_img'/>
            </div>
            <div id="serverContent"> 
            </div>
        </div>

        <div id='dbconnect'>
            <div id='network_header' class='component_header'>
            db connect<br />
                <img src='assets/images/rgtaylor_csc_net_wan_cloud.med.png'
                    alt='network' />
            </div>
        </div>

        <div id='database'>
            <div id='database_header' class='component_header'>database<br />
            <img src='assets/images/web_server.small.png'
            alt='database' />
            </div>
            <div id='databaseContent'></div>
        </div>


		</div> 
        <div id="msg" style="clear:both">msg</div>

        </body>
        <?php
    }
}

$page = new EPHPPage();
$scripts = [ 'js/main.js',
			'ui/js/ResizableWindowSet.js',
            'ui/js/ComponentAnimator.js',
             'fs/js/FileExplorer.js',
            'http/js/Browser.js',
            'http/js/GenericAnimation.js',
            'http/js/HTTPAnimation.js',
            'http/js/PendingHttpRequest.js',
            'http/js/MessageBox.js',
            'http/js/ServerFilesystemAnimation.js',
            'php/js/PHPAnimation.js',
            'php/js/DBResults.js',
            'php/js/DBAnimation.js',
            'php/js/DebugMgr.js',
            'php/js/VarsBox.js',
            'lib/js/Slider.js',
            'http://www.free-map.org.uk/jslib/PromiseAjax.js',
            'http://www.free-map.org.uk/jslib/Dialog.js',
            'ace-builds/src-noconflict/ace.js'
        ];

$css = array ('css/ephp.css');

$page->writePage("ephp", $scripts, $css);

?>
