#!/bin/bash
WEBDIR=/home/nick/public_html
SCRIPTDIR=/home/nick/ephp/scripts

cp -r ace-builds assets css fs ftp http js lib php ${wEBDIR}
cp config.json *.php ${WEBDIR}
cp -r scripts ${SCRIPTDIR}
