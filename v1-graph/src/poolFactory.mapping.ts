import { Address, BigInt } from "@graphprotocol/graph-ts";
import { PoolFactory, DeployPool } from "../generated/PoolFactory/PoolFactory";
import { IERC20Minimal } from "../generated/PoolFactory/IERC20Minimal";
import { IERC721Minimal } from "../generated/PoolFactory/IERC721Minimal";
import { LeverV1Pool } from "../generated/PoolFactory/LeverV1Pool";
import {
	PoolEntity,
	TokenEntity,
	OriginalCollectionEntity,
	SyntheticCollectionEntity,
} from "../generated/schema";

export function handleDeployPool(event: DeployPool): void {
	let LeverPool = LeverV1Pool.bind(event.params.pool);
	let LiquidityToken = IERC20Minimal.bind(LeverPool.poolToken());
	let OriginalCollection = IERC721Minimal.bind(
		LeverPool.originalCollection()
	);
	let SyntheticCollection = IERC721Minimal.bind(
		LeverPool.syntheticCollection()
	);

	let poolEntity = new PoolEntity(event.params.pool.toHexString());
	let tokenEntity = new TokenEntity(LeverPool.poolToken().toHexString());
	let originalCollectionEntity = new OriginalCollectionEntity(
		LeverPool.originalCollection().toHexString()
	);
	let syntheticCollectionEntity = new SyntheticCollectionEntity(
		LeverPool.syntheticCollection().toHexString()
	);

	poolEntity.address = event.params.pool;
	poolEntity.created_at = event.block.timestamp;
	poolEntity.collateral_coverage_ratio = event.params.collateralCoverageRatio;
	poolEntity.interest_rate = event.params.interestRate;
	poolEntity.charge_interval = event.params.chargeInterval;
	poolEntity.burn_rate = event.params.burnRate;
	poolEntity.loan_term = event.params.loanTerm;
	poolEntity.min_liquidity = event.params.minLiquidity;
	poolEntity.min_deposit = event.params.minDeposit;
	poolEntity.payment_frequency = event.params.paymentFrequency;

	tokenEntity.address = Address.fromString(tokenEntity.id);
	tokenEntity.pool = poolEntity.id;
	tokenEntity.name = LiquidityToken.name();
	tokenEntity.symbol = LiquidityToken.symbol();

	originalCollectionEntity.address = Address.fromString(
		originalCollectionEntity.id
	);
	originalCollectionEntity.pool = poolEntity.id;
	originalCollectionEntity.name = OriginalCollection.name();
	originalCollectionEntity.symbol = OriginalCollection.symbol();

	syntheticCollectionEntity.address = Address.fromString(
		syntheticCollectionEntity.id
	);
	syntheticCollectionEntity.pool = poolEntity.id;
	syntheticCollectionEntity.name = SyntheticCollection.name();
	syntheticCollectionEntity.symbol = SyntheticCollection.symbol();

	poolEntity.save();
	tokenEntity.save();
	originalCollectionEntity.save();
	syntheticCollectionEntity.save();
}
