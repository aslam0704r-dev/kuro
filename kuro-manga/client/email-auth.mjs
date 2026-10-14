// Reuse the inspected account primitives and store; the compiled export stays
// unchanged. Installed before its consumers capture the original module API.
export function emailAuthExtension(id,api,require) {
 const React=require(15),h=React.createElement,Text=require(202).default,View=require(123).default;
 const {useAccountStore}=require(1386),{AuthField,AuthButton}=require(1701),{styles}=require(1699),{cinema}=require(1379),{router}=require(11);
 if(id===1700) {
  function CredentialForm({mode='login'}) {
   const account=useAccountStore(),signup=mode==='signup',emailOnly=mode==='recovery'||mode==='verification';
   const [method,setMethod]=React.useState('password'),[name,setName]=React.useState(''),[email,setEmail]=React.useState(''),[secret,setSecret]=React.useState('');
   const disabled=!account.configured||account.busy;
   const navigate=next=>{useAccountStore.setState({error:'',message:''});router.replace({pathname:'/account',params:{mode:next}});};
   async function submit() {
    if(signup&&(secret.length<12||name.trim().length<2||name.trim().length>60)) {useAccountStore.setState({error:'Use a 2–60 character name and a password of at least 12 characters.'});return;}
    const action=signup?'signup':mode==='recovery'?'recovery':mode==='verification'?'verification':method==='password'?'login':'otp';
    if(await account.act(action,{name,email,password:secret,channel:'email',address:email}))setSecret('');
   }
   const button=(label,onPress,props={})=>h(AuthButton,{key:label,label,onPress,...props});
   return h(React.Fragment,null,
    !signup&&!emailOnly?h(View,{accessibilityRole:'tablist',style:{flexDirection:'row',gap:6,marginTop:20}},...['password','email'].map(value=>h(require(1382).PressableScale,{key:value,accessibilityRole:'tab',accessibilityState:{selected:method===value},accessibilityLabel:value==='password'?'Password login':'Email OTP login',onPress:()=>{setMethod(value);setSecret('');},style:{flex:1,paddingVertical:14,borderRadius:14,borderWidth:1,borderColor:method===value?cinema.amber:'#544634',backgroundColor:method===value?'#362619':'#171410',alignItems:'center'}},h(Text,{style:{color:cinema.paper,fontSize:11}},value==='password'?'PASSWORD':'EMAIL OTP')))):null,
    signup?h(AuthField,{label:'Display name',value:name,onChange:setName,hint:'Your name'}):null,
    h(AuthField,{label:'Email address',kind:'email',value:email,onChange:setEmail,hint:'you@example.com'}),
    signup||!emailOnly&&method==='password'?h(AuthField,{label:'Password',kind:'password',value:secret,onChange:setSecret,hint:'At least 12 characters'}):null,
    !signup&&!emailOnly&&method==='email'?h(Text,{style:styles.privacy},'Use a one-time code sent to your email to sign in or create an account.'):null,
    button(signup?'Create account':emailOnly||method==='email'?'Send verification code':'Sign in',submit,{disabled,busy:account.busy}),
    !signup&&!emailOnly?h(React.Fragment,null,button('Continue with Google',()=>account.act('google'),{disabled,secondary:true}),h(View,{style:{flexDirection:'row',justifyContent:'center',flexWrap:'wrap'}},button('Forgot password?',()=>navigate('recovery'),{secondary:true}),button('Verify email',()=>navigate('verification'),{secondary:true}))):null,
    button(signup||emailOnly?'Back to sign in':'New here? Create an account',()=>navigate(signup||emailOnly?'login':'signup'),{secondary:true}),
    button('Continue as a guest',()=>router.replace('/'),{secondary:true}),
    h(Text,{style:styles.privacy},'Sign in with your verified email or Google account. Library and reading progress remain on this device.'));
  }
  return {...api,CredentialForm};
 }
 const copies=new Map([
  ['Connect a Supabase project and configure email, SMS and Google providers to activate these options. No code has been sent and no account has been created.','Connect a Supabase project and configure email and Google sign-in to activate these options. No code has been sent and no account has been created.'],
  ['Verification confirms control of an email or phone—not a person’s real-world identity. Your library is still device-local.','Your email is verified. Your library and reading progress remain on this device.']
 ]);
 const rewrite=node=>{if(typeof node==='string')return copies.get(node)||node;if(Array.isArray(node))return node.map(rewrite);if(!React.isValidElement(node))return node;return React.cloneElement(node,{},rewrite(node.props.children));};
 const name=id===1703?'AccountPanel':'AuthScreen',Original=api[name];
 return {...api,[name]:function EmailAccountScreen(props){return rewrite(Original(props));}};
}
