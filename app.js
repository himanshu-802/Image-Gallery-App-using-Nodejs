const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const methodOverride = require('method-override');
const fs = require('fs');
mongoose.connect('mongodb://localhost:27017/images', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

let imageScheme = new mongoose.Schema({ imgUrl: String });

let Picture = mongoose.model('Picture', imageScheme);


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(methodOverride('_method'))

app.get('/upload', (req, res) => {
    res.render('upload');
});

app.get('/', (req, res) => {
    Picture.find({})
        .then(function (images) {
            res.render('index', { images: images });
        })
});

//Set Image Storage

let storage = multer.diskStorage({
    destination: './public/upload/images/',
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }

});
let upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb) {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
        return cb(null, true);
    }
    else {
        return cb('Error hai: Please Images only');
    }
};
function cb(str) {
    return str + 'Lauda ka Cb';
}
app.post('/uploadSingle', upload.single('singleImage'), (req, res, next) => {
    const file = req.file;
    if (!file) {
        return console.log('Plese select an Image');
    }

    let url = file.path.replace('public', '');

    Picture.findOne({ imgUrl: url })
        .then(function (img) {
            if (img) {
                console.log('Duplicate Image. Try Again');
                return res.redirect('/upload');
            }
            Picture.create({ imgUrl: url })
                .then(function (img) {
                    console.log('Image saved to DB');
                    res.redirect('/');
                })
        })
        .catch(function (err) {
            return console.log('ERROR: ' + err);
        });

});

app.post('/uploadMultiple', upload.array('multipleImages'), (req, res, next) => {
    const files = req.files;
    if (!files) {
        return console.log('Please select Images');
    }
    files.forEach((file) => {
        let url = file.path.replace('public', '');
        Picture.findOne({ imgUrl: url })
            .then(function (img) {
                if (img) {
                    return console.log('Duplicate Image');
                }
                 Picture.create({ imgUrl: url });
            })
            .catch(function (err) {
                return console.log('ERROR : ' + err);
            })
    });
    res.redirect('/');
});

app.delete('/delete/:id', (req, res) => {
    let searchQuery = { _id: req.params.id };
    Picture.findOne(searchQuery)
        .then((img) => {
            fs.unlink(__dirname + '/public/' + img.imgUrl, (err) => {
                if (err) return console.log(err);
                Picture.deleteOne(searchQuery)
                    .then(function (img) {
                        res.redirect('/');
                    })

            })
        })
        .catch(function (err) {
            console.log(err);
        });
});

app.listen(3000, () => {
    console.log("Server running on port " + 3000);
});
