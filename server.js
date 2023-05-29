const axios = require('axios');
const express = require('express')
const bodyParser = require("body-parser")



const app = express()
const port = process.env.PORT || 4000
// middleware
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));





app.listen(port, () => {
    console.log("listening", port)
})


app.get('/', (req, res) => {
    res.send("Success Message")
})


function formatUpi(input) {
    const str = input.toString();
    const parts = [str.slice(0, 1), str.slice(1, 3), str.slice(3, 5), str.slice(5, 7), str.slice(7)];
    return parts.join('/');
}

app.post('/', (req, res) => {
    const { sessionId, msisdn, UserInput, serviceCode, networkCode } = req.body


    if (serviceCode == "*662*800*333#") {
        let token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIDE5OTMgOCAwMDA0ODg5IDIgMDIiLCJpYXQiOjE2ODE4MDgwMDIsImV4cCI6MjAwMjgwODAwMiwicGVybWlzc2lvbnMiOlsiQVBQUk9WRV9BUFBFQUwiLCJSRUpFQ1RfQVBQRUFMIiwiVFJBTlNGRVJfSE9VU0VfSE9MRCIsIlZJRVdfQURNSU5JU1RSQVRJVkVfRU5USVRZIiwiVklFV19IT1VTRV9IT0xEIiwiVklFV19NRU1CRVIiLCJWSUVXX1FVRVNUSU9OTkFJUkUiXX0.UTLdkYHlXHulx326Pmuign58DttHiu7EXWPQ446d-naJsPykjGxoEm_yx2331Eo3n_vvVxjr9eaNHV8y2MjfzA';
        let response;
        let message;
        let continueSession;
        let array;
        array = UserInput.split('*')
        if (UserInput == "*662*800*333#") {
            message = "Welcome to Social Registry\n";
            message += "Enter your national ID";
            continueSession = 1
            response = JSON.stringify({
                "sessionId": sessionId,
                "message": message,
                "ContinueSession": continueSession
            });
            res.send(response);
            res.end
        }
        else {
            if (array.length === 5) {
                const options = {
                    method: 'POST',
                    url: 'https://api-gateway.uat.minaloc.gov.rw/users/auth/login-ussd',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'Authorization': `Bearer ${token}`,
                        'identificationNumber': array[4].slice(0, -1),
                        'phone': msisdn.slice(2)
                    }
                };

                axios.request(options).then(function (response) {
                    console.log(response.data.status)
                    if (response.data.status == true) {

                        message = "Welcome to SRIS\n";
                        message += "1. Household Information. \n 2. Transfer household \n 3. Appeal";
                        continueSession = 1
                        response = JSON.stringify({
                            "sessionId": sessionId,
                            "message": message,
                            "ContinueSession": continueSession
                        });
                        res.send(response);
                        res.end
                    }
                    else {
                        message = response.data.response;
                        continueSession = 0
                        response = JSON.stringify({
                            "sessionId": sessionId,
                            "message": message,
                            "ContinueSession": continueSession
                        });
                        res.send(response);
                        res.end
                    }
                })


            }

            if (array.length === 6) {
                if (array[5] == "1#") {
                    message = "1. See household details. \n 2. See household members";
                    continueSession = 1
                    response = JSON.stringify({
                        "sessionId": sessionId,
                        "message": message,
                        "ContinueSession": continueSession
                    });
                    res.send(response);
                    res.end
                }

                if (array[5] == "2#") {
                    message = "Enter UPI of your Location\n";
                    continueSession = 1
                    response = JSON.stringify({
                        "sessionId": sessionId,
                        "message": message,
                        "ContinueSession": continueSession
                    });
                    res.send(response);
                    res.end
                }

                if (array[5] == "3#") {
                    message = "Select appeal category\n";
                    message += "1. Personal info \n 2. Enrolled program \n 3. Social economic";
                    continueSession = 1
                    response = JSON.stringify({
                        "sessionId": sessionId,
                        "message": message,
                        "ContinueSession": continueSession
                    });
                    res.send(response);
                    res.end
                }
            }

            if (array.length === 7) {
                if (array[5] == "1") {
                    if (array[6] == "1#") {
                        const options = {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                                'documentNumber': array[4],
                            }
                        };

                        axios.get(`https://api-gateway.uat.minaloc.gov.rw/households/view/household/by-document-number`, options).then((resp) => {
                            message = `Household code: ${resp.data.response.code} \nHousehold size: ${resp.data.response.size} \nLODA Code: ${resp.data.response.lodaHouseholdCode}  \nTarget program: ${resp.data.response.targetingProgram} \n Score: ${resp.data.response.score}`;
                            continueSession = 0
                            response = JSON.stringify({
                                "sessionId": sessionId,
                                "message": message,
                                "ContinueSession": continueSession
                            });
                            res.send(response);
                            res.end
                        }).catch((error) => {
                            console.log(error)
                        })

                    }
                    if (array[6] == "2#") {
                        const options = {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                                'documentNumber': array[4],
                            }
                        };

                        axios.get(`https://api-gateway.uat.minaloc.gov.rw/households/view/household/by-document-number`, options).then((resp) => {
                            console.log(resp.data.response)
                            axios.get(`https://api-gateway.uat.minaloc.gov.rw/households/${resp.data.response.id}/members`, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                }
                            }).then((resp) => {
                                console.log(resp.data.response.members)
                                message = "Household members \n";

                                if (resp.data.response.members.length > 0) {
                                    for (var i = 0; i < resp.data.response.members.length; i++) {
                                        message += `${i + 1}. ${resp.data.response.members[i].firstName} ${resp.data.response.members[i].lastName}\n`
                                    }
                                }
                                else {
                                    message += 'There is no other member'
                                }



                                continueSession = 0
                                response = JSON.stringify({
                                    "sessionId": sessionId,
                                    "message": message,
                                    "ContinueSession": continueSession
                                });
                                res.send(response);
                                res.end
                            }).catch((error) => {
                                console.log(error)
                            })
                        }).catch((error) => {
                            console.log(error)
                        })

                    }
                }
                if (array[5] == "3") {
                    message = "Enter your reason\n";
                    continueSession = 1
                    response = JSON.stringify({
                        "sessionId": sessionId,
                        "message": message,
                        "ContinueSession": continueSession
                    });
                    res.send(response);
                    res.end

                }


                if (array.length == 7 && array[5] == "2") {
                    const options = {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'upi': formatUpi(array[6].slice(0, -1)),
                        }
                    };

                    axios.get(`https://api-gateway.uat.minaloc.gov.rw/land/upi/details`, options).then((resp) => {
                        console.log(resp.data.response)
                        if (resp.data.status == true) {
                            const cellCode = resp.data.response.parcelLocation.cell.cellCode
                            const _cellCode = cellCode.substring(0, 1) + cellCode.substring(2);
                            axios.get(`https://api-gateway.uat.minaloc.gov.rw/households/locations/villages/cell/code/${_cellCode}`, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                }

                            }).then((resp) => {
                                console.log(resp.data.response)
                                message = "Select Village \n";

                                if (resp.data.response.length > 0) {
                                    for (var i = 0; i < resp.data.response.length; i++) {
                                        message += `${i + 1}. ${resp.data.response[i].name}\n`
                                    }
                                }
                                else {
                                    message = 'There is no village'
                                }
                                continueSession = 1
                                response = JSON.stringify({
                                    "sessionId": sessionId,
                                    "message": message,
                                    "ContinueSession": continueSession
                                });
                                res.send(response);
                                res.end
                            }).catch((error) => {
                                console.log(error)
                            })

                        }
                        else {
                            continueSession = 0
                            response = JSON.stringify({
                                "sessionId": sessionId,
                                "message": "Invalid UPI",
                                "ContinueSession": continueSession
                            });
                            res.send(response);
                            res.end
                        }
                    }).catch((error) => {
                        console.log(error)
                    })

                }

            }




            if (array.length === 8) {

                if (array[5] == "2") {


                    const options = {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'upi': formatUpi(array[6]),
                        }
                    };

                    axios.get(`https://api-gateway.uat.minaloc.gov.rw/land/upi/details`, options).then((resp) => {
                        console.log(resp.data.response)
                        const upiInfo = resp.data.response
                        if (resp.data.status == true) {
                            const cellCode = resp.data.response.parcelLocation.cell.cellCode
                            const _cellCode = cellCode.substring(0, 1) + cellCode.substring(2);
                            axios.get(`https://api-gateway.uat.minaloc.gov.rw/households/locations/villages/cell/code/${_cellCode}`, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                }

                            }).then((resp) => {
                                let villageId;
                                for (var i = 0; i < resp.data.response.length; i++) {
                                    if (array[7].slice(0, -1) == i + 1) {
                                        villageId = resp.data.response[i].id
                                    }
                                }

                                const options__ = {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`,
                                        'documentNumber': array[4],
                                    }
                                };

                                axios.get(`https://api-gateway.uat.minaloc.gov.rw/households/view/household/by-document-number`, options__).then((resp) => {
                                    const options_ = {
                                        method: 'POST',
                                        url: 'https://api-gateway.uat.minaloc.gov.rw/households/transfer',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`,
                                        },
                                        data: JSON.stringify({
                                            "householdId": resp.data.response.id,
                                            "villageId": villageId,
                                            'upi': upiInfo.upi,
                                            'latitude': upiInfo.centralCoordinate.y,
                                            'longitude': upiInfo.centralCoordinate.x,
                                            'userType': 'CITIZEN',
                                            'event': "REQUEST",
                                            'memberDocumentNumber': array[4]
                                        })
                                    };



                                    axios.request(options_).then(function (response) {
                                        console.log(response.data.response)
                                        if (response.data.status == true) {
                                            message = "Transfer sent successfully\n";
                                        }
                                        else {
                                            message = response.data.response;
                                        }
                                        continueSession = 0
                                        response = JSON.stringify({
                                            "sessionId": sessionId,
                                            "message": message,
                                            "ContinueSession": continueSession
                                        });
                                        res.send(response);
                                        res.end
                                    }).catch(function (error) {
                                        console.error(error);
                                    });
                                }).catch((error) => {
                                    console.log(error)
                                })


                            }).catch((error) => {
                                console.log(error)
                            })

                        }

                    }).catch((error) => {
                        console.log(error)
                    })


                }



                if (array[5] == "3") {

                    const options = {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'documentNumber': array[4],
                        }
                    };

                    axios.get(`https://api-gateway.uat.minaloc.gov.rw/households/view/household/by-document-number`, options).then((resp) => {
                        console.log(resp.data.response)
                        const options_ = {
                            method: 'POST',
                            url: 'https://api-gateway.uat.minaloc.gov.rw/households/public/appeals',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            data: JSON.stringify({
                                "documentNumber": array[4],
                                "option": array[6] == 1 ? "PERSONAL_INFO" : (array[6] == 2 ? "ENROLLED_PROGRAM" : "SOCIAL_ECONOMIC"),
                                "description": array[7].slice(0, -1),
                                "householdID": resp.data.response.id
                            })
                        };


                        axios.request(options_).then(function (response) {
                            console.log(response.data.status)
                            if (response.data.status == true) {
                                message = "Appeal request sent successfully\n";
                            }
                            else {
                                message = "Appeal request failed\n";
                            }
                            continueSession = 0
                            response = JSON.stringify({
                                "sessionId": sessionId,
                                "message": message,
                                "ContinueSession": continueSession
                            });
                            res.send(response);
                            res.end
                        }).catch(function (error) {
                            console.error(error);
                        });
                    }).catch((error) => {
                        console.log(error)
                    })






                }
            }

        }
    }
    else {

        continueSession = 0
        response = JSON.stringify({
            "sessionId": sessionId,
            "message": "Please dial *662*800*333# ",
            "ContinueSession": continueSession
        });
        res.send(response);
        res.end

    }


})
