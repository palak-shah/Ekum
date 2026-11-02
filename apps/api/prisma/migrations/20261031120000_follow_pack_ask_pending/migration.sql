-- Look follower can ask mill for shop-wide Share without dropping See.
ALTER TABLE "Follow" ADD COLUMN "packAskPending" BOOLEAN NOT NULL DEFAULT false;
