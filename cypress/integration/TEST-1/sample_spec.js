//<reference types="cypress"/>

const { publicDecrypt } = require("crypto")
const stringify = require("json-stringify-safe")

describe('FIRST TEST', function() {
    let code;
    it('Visit Transcendence', function() {
        cy.visit('http://c3r2p6:8080')
        cy.get('[class="buttonLogin"]').click()
        cy.contains('Forgot or change your password?').should('exist')
        cy.get('[class="login-control string optional"]').type('pmontiel')
        cy.get('[class="login-control password optional"]').type('Neuilly2037@')
        cy.get('[class="btn btn-login"]').click() 
       // cy.visit('http://localhost:8080/profile')
    })
    it('get auth connection', () => {
        cy.request({
            method: 'GET',
           // url: 'https://api.intra.42.fr/oauth/authorize',
            url: 'https://api.intra.42.fr/oauth/authorize?client_id=' + 'f1c0d7ea3d94e4b1c3ff97aa1ed42bbf3d597d4564436fd17cdc604dc01209fa' + 'http://c3r2p6:8080' + '&response_type=code',
          /*  form: true,
            body:{
                "client_id": 'f1c0d7ea3d94e4b1c3ff97aa1ed42bbf3d597d4564436fd17cdc604dc01209fa',
                "redirect_uri": 'http://localhost:8080',
                "response_type": code,
                "scope": publicDecrypt,
            }*/
        }).then(response=>{
           // cy.log(JSON.stringify(response));
           // cy.log(response.body.code);
            console.log(response)
        })
    })/*
    console.log(code)
    it('get acces token', () => {
            cy.request({
            method: 'POST',
            url: 'https://api.intra.42.fr/oauth/token',
            form: true,
            body:{
                "grant_type": "authorization_code",
                "client_id": process.env.CLIENT_ID,
                "client_secret": process.env.CLIENT_SECRET,
                "code": code,
                'redirect_uri': process.env.REDIRECT_URI
            }
        }).then(response =>{
            cy.log(JSON.stringify(response));
            cy.log(response.body);
        })
    })
//        }
//        )
//})*/
})