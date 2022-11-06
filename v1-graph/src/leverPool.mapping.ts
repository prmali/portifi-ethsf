import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
	LeverV1Pool,
	Create,
	Deposit,
	Collect,
	Borrow,
	Repay,
	Liquidate,
} from "../generated/LeverV1Pool/LeverV1Pool";
import {
	DepositEntity,
	LoanEntity,
	RepayEntity,
	AccountEntity,
	EventEntity,
	InstallmentEntity,
} from "../generated/schema";

function generateAccount(address: Address): void {
	let accountEntity = AccountEntity.load(address.toHexString());
	if (!accountEntity) {
		accountEntity = new AccountEntity(address.toHexString());
		accountEntity.address = address;

		accountEntity.save();
	}
}

/* function getLatestLoan(
	strTemplate: String
): { loanEntity: LoanEntity | null; latestIndex: BigInt } {
	let latestIndex = BigInt.fromI32(0);

	let prevLoanEntity = null;
	let currLoanEntity = LoanEntity.load(`${strTemplate}-${latestIndex}`);

	while (currLoanEntity) {
		prevLoanEntity = currLoanEntity;
		currLoanEntity = LoanEntity.load(`${strTemplate}-${latestIndex}`);
		latestIndex = latestIndex.plus(BigInt.fromI32(1));
	}

	return { loanEntity: prevLoanEntity, latestIndex };
} */

export function handleCreatePool(event: Create): void {}

export function handleDeposit(event: Deposit): void {
	generateAccount(event.params.depositor);

	let depositEntity = DepositEntity.load(
		`${event.address.toHexString()}-${event.params.depositor.toHexString()}`
	);
	let eventEntity = new EventEntity(
		`${event.address.toHexString()}-${event.params.depositor.toHexString()}-${
			event.block.timestamp
		}-${event.logIndex.toString()}`
	);

	if (!depositEntity) {
		depositEntity = new DepositEntity(
			`${event.address.toHexString()}-${event.params.depositor.toHexString()}`
		);
		depositEntity.pool = event.address.toHexString();
		depositEntity.account = event.params.depositor.toHexString();
		depositEntity.occurred_at = event.block.timestamp;
		depositEntity.value = BigInt.fromI32(0);
	}
	depositEntity.value = depositEntity.value.plus(event.params.value);

	eventEntity.parent_id = depositEntity.id;
	eventEntity.event_type = "DEPOSIT";
	eventEntity.pool = event.address.toHexString();
	eventEntity.account = event.params.depositor.toHexString();
	eventEntity.occurred_at = event.block.timestamp;
	eventEntity.value = event.params.value;

	depositEntity.save();
	eventEntity.save();
}

export function handleCollect(event: Collect): void {
	let depositEntity = DepositEntity.load(
		`${event.address.toHexString()}-${event.params.collector.toHexString()}`
	);
	let eventEntity = new EventEntity(
		`${event.address.toHexString()}-${event.params.collector.toHexString()}-${
			event.block.timestamp
		}-${event.logIndex.toString()}`
	);

	if (!depositEntity) {
		return;
	}

	depositEntity.value = depositEntity.value.minus(event.params.value);

	eventEntity.parent_id = depositEntity.id;
	eventEntity.event_type = "COLLECT";
	eventEntity.pool = event.address.toHexString();
	eventEntity.account = event.params.collector.toHexString();
	eventEntity.occurred_at = event.block.timestamp;
	eventEntity.value = event.params.value;

	depositEntity.save();
	eventEntity.save();
}

export function handleBorrow(event: Borrow): void {
	let leverV1Pool = LeverV1Pool.bind(event.address);

	generateAccount(event.params.borrower);

	let latestIndex = BigInt.fromI32(0);
	let strTemplate = `${event.address.toHexString()}-${event.params.borrower.toHexString()}-${event.params.tokenId.toString()}`;

	let prevLoanEntity = LoanEntity.load(`${strTemplate}-${latestIndex}`);
	let currLoanEntity = prevLoanEntity;

	while (currLoanEntity) {
		prevLoanEntity = currLoanEntity;
		currLoanEntity = LoanEntity.load(`${strTemplate}-${latestIndex}`);
		latestIndex = latestIndex.plus(BigInt.fromI32(1));
	}

	/* let { latestIndex } = getLatestLoan(
		`${event.address.toHexString()}-${event.params.borrower.toHexString()}-${event.params.tokenId.toString()}`
	); */
	let eventEntity = new EventEntity(
		`${event.address.toHexString()}-${event.params.borrower.toHexString()}-${event.params.tokenId.toString()}-${
			event.block.timestamp
		}-${event.logIndex.toString()}`
	);

	let loan = leverV1Pool.getTokenLoanStatus(event.params.tokenId);

	let loanEntity = new LoanEntity(
		`${event.address.toHexString()}-${event.params.borrower.toHexString()}-${event.params.tokenId.toString()}-${latestIndex}`
	);
	loanEntity.created_at = loan.createdTimestamp;
	loanEntity.pool = event.address.toHexString();
	loanEntity.account = event.params.borrower.toHexString();
	loanEntity.principal = loan.principal;
	loanEntity.interest = loan.interest;
	loanEntity.daily_percent_rate = loan.dailyPercentRate;
	loanEntity.payment_frequency = loan.paymentFrequency;
	loanEntity.loan_term = loan.loanTerm;
	loanEntity.finalized_at = loan.finalizedTimestamp;
	loanEntity.active = loan.active;
	loanEntity.repayment_allowance = loan.repaymentAllowance;
	for (let i = 0; i < loan.installments.length; i++) {
		let installment = loan.installments[i];
		let installmentEntity = new InstallmentEntity(
			`${event.address.toHexString()}-${event.params.borrower.toHexString()}-${event.params.tokenId.toString()}-${
				event.block.timestamp
			}-${i}`
		);
		installmentEntity.amount = installment.amount;
		installmentEntity.due_at = installment.dueTimestamp;
		installmentEntity.loan = loanEntity.id;

		installmentEntity.save();
	}
	loanEntity.installments_remaining = loan.installmentsRemaining;
	loanEntity.collateral = loan.collateral;
	loanEntity.token_id = event.params.tokenId;
	loanEntity.status = "OPEN";

	eventEntity.parent_id = loanEntity.id;
	eventEntity.event_type = "BORROW";
	eventEntity.pool = event.address.toHexString();
	eventEntity.account = event.params.borrower.toHexString();
	eventEntity.occurred_at = event.block.timestamp;
	eventEntity.value = event.params.value;

	loanEntity.save();
	eventEntity.save();
}

export function handleRepay(event: Repay): void {
	let latestIndex = BigInt.fromI32(0);
	let strTemplate = `${event.address.toHexString()}-${event.params.borrower.toHexString()}-${event.params.tokenId.toString()}`;

	let prevLoanEntity = LoanEntity.load(`${strTemplate}-${latestIndex}`);
	let currLoanEntity = prevLoanEntity;

	while (currLoanEntity) {
		prevLoanEntity = currLoanEntity;
		currLoanEntity = LoanEntity.load(`${strTemplate}-${latestIndex}`);
		latestIndex = latestIndex.plus(BigInt.fromI32(1));
	}

	let loanEntity = prevLoanEntity;
	/* let { loanEntity } = getLatestLoan(
		`${event.address.toHexString()}-${event.params.borrower.toHexString()}-${event.params.tokenId.toString()}`
	); */
	let repayEntity = new RepayEntity(
		`${event.address.toHexString()}-${event.params.borrower.toHexString()}-${event.params.tokenId.toString()}-${event.block.timestamp.toString()}`
	);
	let eventEntity = new EventEntity(
		`${event.address.toHexString()}-${event.params.borrower.toHexString()}-${event.params.tokenId.toString()}-${
			event.block.timestamp
		}-${event.logIndex.toString()}`
	);

	if (!loanEntity) {
		return;
	}

	if (
		loanEntity.status === "COMPLETED" ||
		loanEntity.status === "LIQUIDATED"
	) {
		return;
	}

	loanEntity.principal = loanEntity.principal.minus(event.params.value);
	if (loanEntity.principal === BigInt.fromI32(0))
		loanEntity.status = "COMPLETED";

	eventEntity.parent_id = loanEntity.id;
	eventEntity.event_type = "REPAY";
	eventEntity.pool = event.address.toHexString();
	eventEntity.account = event.params.borrower.toHexString();
	eventEntity.occurred_at = event.block.timestamp;
	eventEntity.value = event.params.value;

	repayEntity.pool = event.address.toHexString();
	repayEntity.account = event.params.borrower.toHexString();
	repayEntity.occurred_at = event.block.timestamp;
	repayEntity.value = event.params.value;
	repayEntity.token_id = event.params.tokenId;

	loanEntity.save();
	eventEntity.save();
	repayEntity.save();
}

export function handleLiquidiate(event: Liquidate): void {}
