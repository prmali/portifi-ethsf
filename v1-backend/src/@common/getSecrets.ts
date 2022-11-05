import { SecretsManager } from "aws-sdk";

const client = new SecretsManager({
	region: "us-east-2",
});

export default async (secretsName: string): Promise<Secrets> => {
	const secrets = await client
		.getSecretValue({
			SecretId: secretsName,
		})
		.promise();

	return JSON.parse(secrets.SecretString);
};

export interface Secrets {
	PRIVATE_KEY: string;
	ALCHEMY_API_KEY: string;
}
