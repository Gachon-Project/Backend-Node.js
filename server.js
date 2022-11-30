var express = require('express');
var app = express();
const db = require('./config/db');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());

//ingredientsAPI
var ingreApi = require('./api/ingredients');
app.post('/ingredients', ingreApi.postIngredients);                         // flask에서 분석된 재료명 받아옴
app.get('/ingredients-flask', ingreApi.getIngredientFromFlask);             // 받아온 재료들의 정보를 react로 보냄
app.get('/ingredients', ingreApi.getIngredients);                           // 보유 중인 재료 보냄 (id, 한글이름 , 영어이름)
app.delete('/ingredients/:ingre_name', ingreApi.deleteIngredients);         // 보유 중인 재료 중 ingre_name 삭제
app.get('/ingredients-exact/:recipe_id', ingreApi.getIngredientsDetail);    // 요리에 들어가는 실제 재료들 정보 get

//recipesAPI
var recipeApi = require('./api/recipes');
app.get('/recipes', recipeApi.getRecipes);
app.get('/recipes-all', recipeApi.getRecipesAll);
app.get('/recipes-replace', recipeApi.getRecipesReplace);
app.get('/recipes/:recipe_id', recipeApi.getRecipesDetail);

var server = app.listen(8000, function() {
    db.query(`DELETE FROM TEMP_TB WHERE deleteIngre = 0;`, function(error5, del) {       // 서버 켜질 때 delete
        console.log("temp_db delete complete");
        console.log('load Success!');
    });
});