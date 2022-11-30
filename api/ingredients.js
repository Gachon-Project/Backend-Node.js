const db = require('../config/db');

var SQL = `SELECT MY_INGREDIENTS_TB.INGREDIENTS_ID, MY_INGREDIENTS_TB.INGREDIENTS_NAME, INGREDIENTS_TB.INGREDIENTS_ENG_NAME
FROM MY_INGREDIENTS_TB LEFT JOIN INGREDIENTS_TB ON MY_INGREDIENTS_TB.INGREDIENTS_NAME = INGREDIENTS_TB.INGREDIENTS_NAME
ORDER BY MY_INGREDIENTS_TB.INGREDIENTS_ID`;

exports.postIngredients = function(req, res) {
    db.query(`DELETE FROM TEMP_TB WHERE deleteIngre = 0;`, function(error5, del) {       // flask한테 정보 받을때 delete
        console.log("delete complete");
    });

    var inputValue = req.body; //flask에서 재료명 받기
    var result = Object.values(inputValue);
    console.log(result);

    var insertValue = "";
    for(var i = 0; i < result.length; i++) {
        insertValue += `('${result[i]}'), `;
    }
    insertValue = insertValue.slice(0, -2);
    console.log(insertValue);

    db.query(`INSERT INTO TEMP_TB (INGREDIENTS_ENG_NAME) VALUE ${insertValue};`, function(error, result) {
        if(error) {
            console.log('error');
        }
        res.send(result);
    });
}
exports.getIngredientFromFlask = function(req, res) {
    db.query(`SELECT INGREDIENTS_ENG_NAME FROM TEMP_TB;`, function(error4, tempDB) {
        var flaskINGRE = "";
        for(var i = 0; i < tempDB.length; i++) {
            flaskINGRE += `'${tempDB[i].INGREDIENTS_ENG_NAME}', `;
        }
        flaskINGRE = flaskINGRE.slice(0, -2);
        console.log(flaskINGRE);

        db.query(`SELECT * FROM INGREDIENTS_TB WHERE INGREDIENTS_ENG_NAME IN (${flaskINGRE});`, function(error, inputV) {
            if(error) {
                console.log(error);
            }
            db.query(`SELECT INGREDIENTS_NAME FROM MY_INGREDIENTS_TB;`, function(error2, dupIngre) {
                console.log(inputV);
                var exist = false;
                var inputINGRE = "";
                for(var i = 0; i < inputV.length; i++) {     // DB에 재료명 넣기 전에 이미 있는지 확인!! // flask에서 같은 재료 여러개 받았는지 확인!!
                    for(var j = 0; j < dupIngre.length; j++) {
                        if (inputV[i].INGREDIENTS_NAME === dupIngre[j].INGREDIENTS_NAME) {
                            exist = true;
                        }
                    }
                    if(exist === false) {   // 안겹치면 DB에 입력
                        db.query(`INSERT INTO MY_INGREDIENTS_TB (INGREDIENTS_NAME) VALUE ('${inputV[i].INGREDIENTS_NAME}')`, function(error3, result) {
                            if(error3) {
                                console.log(error3);
                            }
                        });
                        inputINGRE += `${inputV[i].INGREDIENTS_NAME}, `
                    } else {
                        exist = false;
                    }
                }
                res.send(inputV);
            })
        });
    });
};

exports.getIngredients = function(req, res) {   // 냉장고 버튼 누르면 재료 목록 뜨기
    db.query(SQL, function(error, ingredients) { //INGREDIENTS_ID, INGREDIENTS_NAME, INGREDIENTS_ENG_NAME 
        res.send(ingredients);
    });
};

exports.deleteIngredients = function(req, res) {
    var ingre_name = req.params.ingre_name;
    // db.query(`DELETE FROM MY_INGREDIENTS_TB WHERE INGREDIENTS_NAME = ?`, [ingre_name], function(error, result) {
    //     res.send(`${ingre_name} delete complete`);
    // })               // 완료
    res.send(`${ingre_name} delete complete`);
}

exports.getIngredientsDetail = function(req, res) {
    var recipe_id = req.params.recipe_id;
    db.query(`SELECT DISTINCT FOOD_TB.FOOD_ID, FOOD_EXACT_TB.FOOD_NAME, FOOD_EXACT_TB.INGREDIENTS_NAME, FOOD_EXACT_TB.INGREDIENTS_AMOUNT
        FROM FOOD_EXACT_TB LEFT JOIN FOOD_TB ON FOOD_TB.FOOD_NAME = FOOD_EXACT_TB.FOOD_NAME WHERE FOOD_TB.FOOD_ID = ${recipe_id}`, function(error, food_detail) {
            
        res.send(food_detail);
    });
}