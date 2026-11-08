# SolTrail video script

English voiceover for a 1 to 2 minute screen recording. Button names match the app. The timing below is a plan for the edit, not a measured runtime.

Record on a browser with no saved SolTrail progress. Phantom must be on Solana Devnet. Setup steps are in `docs/DEMO.md`. Try the airdrop once before you record. If Devnet refuses it, use the faucet line in scene 4. Do not say the airdrop succeeded.

Stay quiet while the Phantom popup is open. Hold on the four Pass lines and on the proof page. Cut any spinner that runs long. Do not show The Receipt, The Clock, or Your Key as their own scenes. The last line covers them.

## Scene 1. Home

Screen: http://localhost:3000, heading "Learn Solana by doing".

Say:

"SolTrail walks someone new to Solana through Devnet, one stage at a time."

Click **Open the quests**.

## Scene 2. Quest list

Screen: Quests, score `0 / 1600 XP`, six cards. Wallet Basics is Ready.

Say:

"The next stage stays locked until this one clears. The score stays in this browser, for this wallet. There is no account."

Click **Wallet Basics**.

## Scene 3. Wallet

Click **Connect Phantom** and approve the popup. Stay quiet during the popup.

Then say:

"The app receives the public address and never asks for a private key."

Click **Show the full address**. When the full address is visible:

"Here is the address."

Click **Read my balance**. When the balance is visible:

"And the Devnet balance, in SOL and lamports."

Click **Open Devnet SOL**.

## Scene 4. Practice SOL

Click **Note my starting balance**. Wait for the lamport figure.

Say:

"I note the start and request 1 SOL from Devnet."

Click **Request an airdrop**. Wait for `Airdrop signature:`.

Click **Check that it arrived**.

"This stage clears only when the balance rises, or the airdrop signature is confirmed."

If the airdrop is refused, do not say that line. Click **Open the public faucet**, send SOL to the address on screen, come back, click **Check that it arrived**, and say:

"The Devnet faucet is rate limited, so I use the public faucet and wait until the balance is higher than the start."

Click **Open First Message**.

## Scene 5. The note

Keep the note large on screen: `SOLTRAIL|QUEST=HELLO_SOLANA|ID=` and the UUID.

Say:

"The note is already on the page: SOLTRAIL, quest HELLO_SOLANA, and an ID. Nothing is sent until I approve it."

Click **Use this note**, then **Send this message**. Stay quiet, and approve in Phantom. The page moves through Preparing, Waiting for Wallet, Sending, Confirming, and Success.

After Success:

"Phantom signs it. The fee is Devnet SOL."

## Scene 6. The check

Click **Check this transaction**. Hold on the four Pass lines.

Say:

"SolTrail reads that transaction back. Four checks have to pass: the signature is found, there is no error, this wallet signed it, and the Memo text matches."

Click **View on Solana Explorer**. Show the Devnet cluster, then come back.

Click **Open the proof page**. Hold on "Devnet confirms this SolTrail practice message."

"The proof page reads it again. When it passes, Devnet confirms this SolTrail practice message."

## Scene 7. Close

Stay on the proof page. Do not open the later quests.

Say:

"The stages after this read the fee, the block time, the program, the slot, and the genesis hash. 1,600 XP stays in this browser. The transaction stays on Devnet."

End.

## Read-through

Pause at each slash. Those pauses are the clicks, the wallet popup, and the holds.

"SolTrail walks someone new to Solana through Devnet, one stage at a time. / The next stage stays locked until this one clears. The score stays in this browser, for this wallet. There is no account. / The app receives the public address and never asks for a private key. / Here is the address. / And the Devnet balance, in SOL and lamports. / I note the start and request 1 SOL from Devnet. / This stage clears only when the balance rises, or the airdrop signature is confirmed. / The note is already on the page: SOLTRAIL, quest HELLO_SOLANA, and an ID. Nothing is sent until I approve it. / Phantom signs it. The fee is Devnet SOL. / SolTrail reads that transaction back. Four checks have to pass: the signature is found, there is no error, this wallet signed it, and the Memo text matches. / The proof page reads it again. When it passes, Devnet confirms this SolTrail practice message. / The stages after this read the fee, the block time, the program, the slot, and the genesis hash. 1,600 XP stays in this browser. The transaction stays on Devnet."

## If the cut is still over 2 minutes

Drop scene 4 from the video. Clear Devnet SOL before you record, on the same browser and the same wallet, and start the recording on **First Message**. Replace the opening with:

"SolTrail walks someone new to Solana through Devnet. Wallet Basics and Devnet SOL are already cleared in this browser. What follows is the Memo transaction, checked against Devnet."

Then play scenes 5, 6, and 7.
