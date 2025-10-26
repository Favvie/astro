/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 * eslint-disable-next-line @typescript-eslint/no-explicit-any
 */
import { CampaignDAOFactory, CampaignDAOFactory_CampaignDAOCreated, Launchpad, Launchpad_CampaignCancelled, Launchpad_CampaignCreated, Launchpad_CampaignPromoted, Launchpad_FundingCompleted, Launchpad_LiquidityAdded, Launchpad_OgPointsAwarded, Launchpad_PlatformFeeUpdated, Launchpad_RefundClaimed, Launchpad_TokensPurchased, Launchpad_UserParticipatedInCampaign, LaunchpadV2, LaunchpadV2_CampaignCancelled, LaunchpadV2_LiquidityEvent, LaunchpadV2_RefundClaimed, LaunchpadV2_SwapEvent, Usdc, Usdc_Approval, Usdc_OwnershipTransferred, Usdc_Transfer } from "../generated";

CampaignDAOFactory.CampaignDAOCreated.handler(async ({ event, context }) => {
	const entity: CampaignDAOFactory_CampaignDAOCreated = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		campaignToken: event.params.campaignToken,
		daoAddress: event.params.daoAddress,
		creator: event.params.creator,
	};

	context.CampaignDAOFactory_CampaignDAOCreated.set(entity);
});

Launchpad.CampaignCancelled.handler(async ({ event, context }) => {
	const entity: Launchpad_CampaignCancelled = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		creator: event.params.creator,
	};

	context.Launchpad_CampaignCancelled.set(entity);
});

Launchpad.CampaignCreated.handler(async ({ event, context }) => {
	const entity: Launchpad_CampaignCreated = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		creator: event.params.creator,
		name: event.params.name,
		targetFunding: event.params.targetFunding,
		totalSupply: event.params.totalSupply,
		deadline: event.params.deadline,
	};

	context.Launchpad_CampaignCreated.set(entity);
});

Launchpad.CampaignPromoted.handler(async ({ event, context }) => {
	const entity: Launchpad_CampaignPromoted = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
	};

	context.Launchpad_CampaignPromoted.set(entity);
});

Launchpad.FundingCompleted.handler(async ({ event, context }) => {
	const entity: Launchpad_FundingCompleted = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		totalFunding: event.params.totalFunding,
	};

	context.Launchpad_FundingCompleted.set(entity);
});

Launchpad.LiquidityAdded.handler(async ({ event, context }) => {
	const entity: Launchpad_LiquidityAdded = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		usdcAmount: event.params.usdcAmount,
		tokensAmount: event.params.tokensAmount,
	};

	context.Launchpad_LiquidityAdded.set(entity);
});

Launchpad.OgPointsAwarded.handler(async ({ event, context }) => {
	const entity: Launchpad_OgPointsAwarded = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		user: event.params.user,
		amount: event.params.amount,
	};

	context.Launchpad_OgPointsAwarded.set(entity);
});

Launchpad.PlatformFeeUpdated.handler(async ({ event, context }) => {
	const entity: Launchpad_PlatformFeeUpdated = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		newFee: event.params.newFee,
	};

	context.Launchpad_PlatformFeeUpdated.set(entity);
});

Launchpad.RefundClaimed.handler(async ({ event, context }) => {
	const entity: Launchpad_RefundClaimed = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		investor: event.params.investor,
		amount: event.params.amount,
	};

	context.Launchpad_RefundClaimed.set(entity);
});

Launchpad.TokensPurchased.handler(async ({ event, context }) => {
	const entity: Launchpad_TokensPurchased = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		buyer: event.params.buyer,
		usdcAmount: event.params.usdcAmount,
		tokensReceived: event.params.tokensReceived,
		timestamp: event.params.timestamp,
	};

	context.Launchpad_TokensPurchased.set(entity);
});

Launchpad.UserParticipatedInCampaign.handler(async ({ event, context }) => {
	const entity: Launchpad_UserParticipatedInCampaign = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		user: event.params.user,
		amount: event.params.amount,
	};

	context.Launchpad_UserParticipatedInCampaign.set(entity);
});

LaunchpadV2.CampaignCancelled.handler(async ({ event, context }) => {
	const entity: LaunchpadV2_CampaignCancelled = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		creator: event.params.creator,
	};

	context.LaunchpadV2_CampaignCancelled.set(entity);
});

LaunchpadV2.LiquidityEvent.handler(async ({ event, context }) => {
	const entity: LaunchpadV2_LiquidityEvent = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		tokenAmount: event.params.tokenAmount,
		usdcAmount: event.params.usdcAmount,
		user: event.params.user,
		tradeType: event.params.tradeType,
		token: event.params.token,
	};

	context.LaunchpadV2_LiquidityEvent.set(entity);
});

LaunchpadV2.RefundClaimed.handler(async ({ event, context }) => {
	const entity: LaunchpadV2_RefundClaimed = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		investor: event.params.investor,
		amount: event.params.amount,
	};

	context.LaunchpadV2_RefundClaimed.set(entity);
});

LaunchpadV2.SwapEvent.handler(async ({ event, context }) => {
	const entity: LaunchpadV2_SwapEvent = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		campaignId: event.params.campaignId,
		amount: event.params.amount,
		user: event.params.user,
		tradeType: event.params.tradeType,
		token: event.params.token,
	};

	context.LaunchpadV2_SwapEvent.set(entity);
});

Usdc.Approval.handler(async ({ event, context }) => {
	const entity: Usdc_Approval = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		owner: event.params.owner,
		spender: event.params.spender,
		value: event.params.value,
	};

	context.Usdc_Approval.set(entity);
});

Usdc.OwnershipTransferred.handler(async ({ event, context }) => {
	const entity: Usdc_OwnershipTransferred = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		previousOwner: event.params.previousOwner,
		newOwner: event.params.newOwner,
	};

	context.Usdc_OwnershipTransferred.set(entity);
});

Usdc.Transfer.handler(async ({ event, context }) => {
	const entity: Usdc_Transfer = {
		id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
		from: event.params.from,
		to: event.params.to,
		value: event.params.value,
	};

	context.Usdc_Transfer.set(entity);
});
