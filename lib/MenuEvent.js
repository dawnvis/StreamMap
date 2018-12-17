/*
* @Author: Dawn
* @Date:   2017-05-11 18:01:21
* @Last Modified by:   Dawn
* @Last Modified time: 2017-05-12 17:22:44
*/

function menuFuncMessage(msgName) {
    if ( msgName == "StartAnim" ) 
    {
        animPlaying = true;
    } 
    else if ( msgName == "StopAnim" ) 
    {
        animPlaying = false;
    }
}

function menuAboutMessage(msgName) {
    if ( msgName == "StreamMap" ) 
    {
        var url = "http://ieeexplore.ieee.org/document/7852440/";
        window.open(url, 'StreamMap');
    }
}

