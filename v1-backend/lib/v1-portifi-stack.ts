import {
	Stack,
	StackProps,
	aws_lambda_nodejs as lambda,
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

		// The code that defines your stack goes here

		// example resource
		// const queue = new sqs.Queue(this, 'V1BackendQueue', {
		//   visibilityTimeout: cdk.Duration.seconds(300)
		// });
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
	}
}
