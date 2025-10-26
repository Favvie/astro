import assert from "assert";
import { 
  TestHelpers,
  CampaignDAOFactory_CampaignDAOCreated
} from "generated";
const { MockDb, CampaignDAOFactory } = TestHelpers;

describe("CampaignDAOFactory contract CampaignDAOCreated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for CampaignDAOFactory contract CampaignDAOCreated event
  const event = CampaignDAOFactory.CampaignDAOCreated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("CampaignDAOFactory_CampaignDAOCreated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await CampaignDAOFactory.CampaignDAOCreated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualCampaignDAOFactoryCampaignDAOCreated = mockDbUpdated.entities.CampaignDAOFactory_CampaignDAOCreated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedCampaignDAOFactoryCampaignDAOCreated: CampaignDAOFactory_CampaignDAOCreated = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      campaignId: event.params.campaignId,
      campaignToken: event.params.campaignToken,
      daoAddress: event.params.daoAddress,
      creator: event.params.creator,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualCampaignDAOFactoryCampaignDAOCreated, expectedCampaignDAOFactoryCampaignDAOCreated, "Actual CampaignDAOFactoryCampaignDAOCreated should be the same as the expectedCampaignDAOFactoryCampaignDAOCreated");
  });
});
