const db = require('../config/db');

var SQL = function(ingreList, NoIngre) {
    return (
        `SELECT FOOD_TB.FOOD_NAME, FOOD_TB.FOOD_ID , COUNT(*) AS COUNT_REAL, INGRE_COUNT.COUNT FROM FOOD_TB LEFT JOIN INGRE_COUNT
            ON FOOD_TB.FOOD_ID = INGRE_COUNT.FOOD_ID
            WHERE INGREDIENTS_NAME IN (${ingreList}) GROUP BY FOOD_TB.FOOD_ID HAVING COUNT_REAL + ${NoIngre} >= INGRE_COUNT.COUNT
            ORDER BY COUNT_REAL DESC, FOOD_TB.FOOD_NAME`
    );
};

exports.getRecipes = function(req, res) {   // 3. 보유 재료로 만들 수 있는 요리 프론트에 보내기
    db.query(`SELECT INGREDIENTS_NAME FROM MY_INGREDIENTS_TB`, function(error, ingredients) {   // 3-1. 냉장고db에서 보유 재료들 가져오기
        if(error) {
            res.send([]);
        }
        var ingreList = '';
        var i = 0;
        while (i < ingredients.length) {
            ingreList = ingreList + `'${ingredients[i].INGREDIENTS_NAME}', `;
            i++;
        }
        ingreList = ingreList.slice(0, -2); //query문에 넣기 좋게 만듬

        db.query(SQL(ingreList, 0), function(error2, recipes) {  // 3-2. 보유 재료들로 만들 수 있는 요리만 검색
            if(error2) {
                res.send([]);
                console.log("recipes X");
            } else {
                if(recipes.length >= 5) {
                    var recipeJson = "[";
                    for(var i = 0; i < recipes.length; i++) {
                        recipeJson += `{"FOOD_NAME" : "${recipes[i].FOOD_NAME}", "FOOD_ID" : ${recipes[i].FOOD_ID}}, `
                    }
                    recipeJson = recipeJson.slice(0, -2) + "]";
                    var recipeObject = JSON.parse(recipeJson);  // JSON을 객체로
                    res.send(recipeObject);
                } else { // 최소 5개
                    db.query(SQL(ingreList, 1), function(error2, recipes2) {
                        var recipeJson = "[";
                        for(var i = 0; i < Math.min(recipes2.length, 5) ; i++) {
                            recipeJson += `{"FOOD_NAME" : "${recipes2[i].FOOD_NAME}", "FOOD_ID" : ${recipes2[i].FOOD_ID}}, `
                        }
                        recipeJson = recipeJson.slice(0, -2) + "]";
                        var recipeObject = JSON.parse(recipeJson);  // JSON을 객체로
                        res.send(recipeObject);
                    });
                }
            }
        });
    });
};
exports.getRecipesAll = function(req, res) {
    db.query(`SELECT DISTINCT FOOD_NAME, FOOD_ID FROM FOOD_TB`, function(error, all) {
        res.send(all);
    })
}

exports.getRecipesReplace = function(req, res) { // 대체품목
    db.query(`SELECT INGREDIENTS_NAME FROM MY_INGREDIENTS_TB`, function(error, ingredients) {
        var ingreList = '';
        var ingreListNot = '';
        var i = 0;
        var exist = 0;
        while (i < ingredients.length) {
            if (ingredients[i].INGREDIENTS_NAME === "돼지고기") { // 돼지고기 -> 소고기 대체품목
                ingreList = ingreList + `'쇠고기', `;
                exist += 1;
            } else if (ingredients[i].INGREDIENTS_NAME === "쇠고기") { // 돼지고기 -> 소고기 대체품목
                ingreList = ingreList + `'돼지고기', `;
                exist += 1;
            } else {
                ingreList = ingreList + `'${ingredients[i].INGREDIENTS_NAME}', `;
                ingreListNot = ingreListNot + `'${ingredients[i].INGREDIENTS_NAME}', `;
            }
            i++;
        }
        ingreList = ingreList.slice(0, -2); //query문에 넣기 좋게 만듬
        ingreListNot = ingreListNot.slice(0, -2);

        if (exist === 1) {
            db.query(SQL(ingreList, 0), function(error2, recipes) {  // 3-2. 보유 재료들(대체품목)로 만들 수 있는 요리만 검색
                db.query(SQL(ingreListNot, 0), function(error3, dupRecipes) {
                    var overlap = false;
                    var recipeJson = "[";
                    for(var i = 0; i < recipes.length; i++) {
                        for(var j = 0; j < dupRecipes.length; j++) {
                            if(recipes[i].FOOD_ID === dupRecipes[j].FOOD_ID) {
                                overlap = true;
                            }
                        }
                        if(overlap === false) {
                            recipeJson += `{"FOOD_NAME" : "${recipes[i].FOOD_NAME}", "FOOD_ID" : ${recipes[i].FOOD_ID}}, `
                        } else {
                            overlap = false;
                        }
                    }
                    recipeJson = recipeJson.slice(0, -2) + "]";
                    var recipeObject;
                    try {
                        recipeObject = JSON.parse(recipeJson);  // JSON을 객체로
                    } catch {
                        recipeObject = [];  // 대체식품으로 만들 수 있는 요리가 없을 경우
                    }
                    res.send(recipeObject);
                });
            });
        } else {
            res.send([]);
        }
    });
};

exports.getRecipesDetail = function(req, res) {     // 레시피 과정
    var recipe_id = req.params.recipe_id;
    db.query(`SELECT * FROM FOOD_PROCESS_TB WHERE FOOD_ID = ${recipe_id}`, function(error, recipeDetail) {

        // [{"FOOD_ID":21,"ORDER":1,"DETAIL":"찬물에 씻어 담가 충분히 불려 물기를 뺀 뒤 손으로 적당하게 잘라 놓는다."}]
        if(JSON.stringify(recipeDetail) === "[]") {
            const context = [{
                FOOD_ID: recipe_id,
                ORDER: "★",
                DETAIL: "추가 예정"
            }, {
                FOOD_ID: recipe_id,
                ORDER: "★",
                DETAIL: "곧 추가하겠습니다."
            }]
            res.send(context);
        } else {
            res.send(recipeDetail);
        }
    })
};