import { ConnectWallet, useAddress, useAuth, useSDK } from "@thirdweb-dev/react"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { signInWithCustomToken } from "firebase/auth"
import initializeFirebaseClient from "../lib/initFirebase"
import type { NextPage } from "next"

const Login: NextPage = () => {
	const address = useAddress()
	const thirdwebAuth = useAuth()

	const { auth, db } = initializeFirebaseClient()

	async function signIn() {
		if (!thirdwebAuth) return

		// Use the same address as the one you use in _app
		const payload = await thirdwebAuth.login({ domain: "example.org" })

		// Make a request to the API with the payload
		const res = await fetch("/api/auth", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ payload }),
		})

		// Get the JWT token from the response
		const { token } = await res.json()

		// Sign in with the token
		signInWithCustomToken(auth, token)
			.then((userCredential) => {
				// On success, we have access to the user object
				const user = userCredential.user

				// If this is a new user, we create a new document in Firestore
				const usersRef = doc(db, "users", user.uid!)

				getDoc(usersRef).then((doc) => {
					if (!doc.exists()) {
						setDoc(usersRef, { createdAt: serverTimestamp() }, { merge: true })
					}
				})
			})
			.catch((error) => {
				console.log(error)
			})
	}

	return (
		<>
			{address ? (
				<>
					<button type="button" onClick={() => signIn()}>
						Sign in with Ethereum
					</button>
				</>
			) : (
				<ConnectWallet />
			)}
		</>
	)
}

export default Login
