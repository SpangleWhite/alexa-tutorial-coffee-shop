// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    // [**追加**] 非同期処理のため async を追加する
    async handle(handlerInput) {
        /*
        const speakOutput = 'ようこそ。何を注文しますか？';
        */
        // [**追加/変更**]
        const attr = await handlerInput.attributesManager.getPersistentAttributes();
        const lastOrder = attr.lastOrder;
        var speechText = `ようこそ。`;
        if (lastOrder !== undefined) {
            speechText += `前回は ${lastOrder}を注文しましたね。`;
        }
        speechText += `今日は何を注文しますか?`;        
        
        return handlerInput.responseBuilder
            /*
            .speak(speakOutput)
            .reprompt(speakOutput)
            */
            .speak(speechText)
            .reprompt(speechText)            
            .getResponse();
    }
};
const OrderIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OrderIntent';
    },
    /*
    handle(handlerInput) {
        const speakOutput = 'ご注文ありがとうございます。';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
    */
    // [**追加**] 非同期処理のため async を追加する
    async handle(handlerInput) {
        // menu と amount スロットの値を取得
        var menu = handlerInput.requestEnvelope.request.intent.slots.menu.value;
        var amount = handlerInput.requestEnvelope.request.intent.slots.amount.value;

        // amount スロットが発話されないときは 1 にする
        if (amount === undefined) {
            amount = 1;
        }

        // [**追加**]
        const attr = await handlerInput.attributesManager.getPersistentAttributes();
        attr.lastOrder = menu;
        handlerInput.attributesManager.setPersistentAttributes(attr);
        await handlerInput.attributesManager.savePersistentAttributes();

        // 応答メッセージの作成。変数を展開するため両端はバッククォートにする。
        const speechText = `${menu}を${amount}杯承りました`;

        return handlerInput.responseBuilder
            .speak(speechText)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }    
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// [**追加**]
//   S3PersistenceAdapterを用意
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        OrderIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
        // [**追加**]
    //   S3PersistentAdapter を PersistentAdapter に設定
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter(
            {bucketName:process.env.S3_PERSISTENCE_BUCKET}))
    .lambda();
