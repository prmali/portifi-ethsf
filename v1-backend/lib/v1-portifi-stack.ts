import {
	Stack,
	StackProps,
	aws_lambda_nodejs as lambda,
	aws_secretsmanager as secretsManager,
	Duration,
} from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import path from "path";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class V1PortifiStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const bundling = {
			minify: true,
			sourceMap: true,
			sourceMapMode: lambda.SourceMapMode.INLINE,
			sourcesContent: false,
			target: "es2020",
		};

		/*****		LAMBDAS		*****/
		const meanReversionLambda = new lambda.NodejsFunction(
			this,
			"MeanReversionLambda",
			{
				entry: path.resolve(__dirname, "../src/meanReversion/app.ts"),
				handler: "lambdaHandler",
				functionName: "DEV-Portifi-MeanReversion",
				memorySize: 512,
				timeout: Duration.minutes(2),
				runtime: Runtime.NODEJS_16_X,
				bundling,
			}
		);

		const singleStalkLambda = new lambda.NodejsFunction(
			this,
			"SingleStalkLambda",
			{
				entry: path.resolve(__dirname, "../src/singleStalk/app.ts"),
				handler: "lambdaHandler",
				functionName: "DEV-Portifi-SingleStalk",
				memorySize: 512,
				timeout: Duration.minutes(2),
				runtime: Runtime.NODEJS_16_X,
				bundling,
			}
		);

		/*****		SECRETS		*****/
		const secrets = secretsManager.Secret.fromSecretPartialArn(
			this,
			"MainSecrets",
			"arn:aws:secretsmanager:us-east-2:191860909899:secret:portifi-secrets"
		);
		secrets.grantRead(meanReversionLambda);
		singleStalkLambda.addEnvironment("MAIN_SECRETS", secrets.secretArn);
	}
}
