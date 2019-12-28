<?php
session_start();

require_once('defines.php');
require_once(LIBDIR.'/Page.php');

class EPHPPage extends Page {

    public function writeBody() {
        ?>
        <body>
		<div id="greyOutOverlay"></div>
        <div id='header' style='position: relative; width: 100%'>
        <div id='titlecontainer'>
        <span class='ephpTitle'>ephp</span><span class='ephpVersion'>3</span>
        </div>
        <div id="login">
        <?php
       if(isset($_SESSION["ephpuser"])) {
            echo "Logged in as $_SESSION[ephpuser]";
            echo " <a href='ftp/logout.php'>Logout</a>";
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

        </div>
        </div>



		<div id='ephp_overall_container'>
        <div id="ephp_container">

        <div id="client">
            <div id='client_header' class='component_header'>client<br />
                <img src='assets/images/computer-laptop.vsmall.png'
                alt='client' id='client_img'/>
            </div>
            <div id='client_toolbar'>
                <img id='file_new' src='assets/images/page_add.2.png' 
                    alt='New file' title='New file' />
                <img id='file_save' src='assets/images/script_save.2.png'
                    alt='Save current file (to Downloads)' 
                    title='Save current file (to Downloads)' />
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

        <div id="networkContainer">
        <div id="network">
        <div id='network_header' class='component_header'>
        network<br />
            <img src='assets/images/rgtaylor_csc_net_wan_cloud.small.png'
                alt='network' id='network_img'/>
        </div>
        </div>
        </div>

        <div id="server">
            <div id='server_header' class='component_header'>server<br />
                <img src='assets/images/web_server.vsmall.png'
                alt='server' id='server_img'/>
            </div>
            <div id="serverContent"> 
            </div>
        </div>

        </div> 
        <div id="msg" style="clear:both"> </div>
        <div id='dbg'>
            <div id='vars'>
                <p><strong>Variables</strong></p>
                <div id='varsInner'></div>
            </div>
            <div id='dbresults'>
                <p><strong>Database Results</strong></p>
                <div id='dbInner'></div>
            </div>
            <div id='log'>
                <p><strong>Script Output</strong></p>
                <div id='logInner'></div>
            </div>
        </div>
		</div>

        </body>
        <?php
    }
}

$page = new EPHPPage();
$scripts = [ 
            'jslib/Dialog.js',
            'ace-builds/src/ace.js',
            'js/bundle.js'
        ];

$css = ['https://fonts.googleapis.com/css?family=Press+Start+2P&display=swap',
        'https://fonts.googleapis.com/css?family=Monoton&display=swap',
        'css/ephp.css'];

$page->writePage("ephp", $scripts, $css);

?>
