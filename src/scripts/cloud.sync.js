function cloud_firstSync(){
    if (!cloud_userinfo){
        return;
    }
    let uid = cloud_userinfo;
    $.ajax({
        url: cloud_apibase + '/sync/firstSync',
        type: 'POST',
        data: {
            uid: uid,
            notes: notes,
            settings: settings,
            categories: categroies
        },
        headers: {
            Authorization: "Bearer " + cloud_token
        },
        dataType: 'json'
    }).then((res)=>{

    }, ()=>{
        console.error('First sync error.');
    });
}