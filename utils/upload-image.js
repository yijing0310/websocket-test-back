import multer from "multer"
import {v4} from 'uuid'

const extMap = {
    'image/jpeg' : '.jpg',
    'image/png' : '.png',
    'image/webp' : '.webp',
}

// 篩選檔案
const fileFilter = (req,file,cb) => {
    cb(null,!!extMap[file.mimetype])
}

// 指定儲存位置和檔名
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'public/imgs')
    },
    filename: function(req,file,cb){
        const f = v4() + extMap[file.mimetype]
        cb(null, f)
    }
})

export default multer({fileFilter,storage})