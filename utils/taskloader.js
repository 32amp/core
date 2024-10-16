function taskLoader(folder){
    const path = require('path').join(__dirname, '').replace("/utils","");
    const fs = require("fs");
    for (const task of require('glob').sync(path + `/${folder}/*`)){
        if( fs.lstatSync(task).isDirectory() ){
            for (const subtask of require('glob').sync(task+"/*")){
                let register = `../`+subtask.replace(path, '').replace('.js', '');
                require(register)
            }
        }else{
            let register = `../${folder}/`+task.replace(path + `/${folder}/`, '').replace('.js', '');
            require(register)
        }
    }
}
taskLoader("tasks");
