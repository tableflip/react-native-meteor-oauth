import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View, WebView } from 'react-native'
import cheerio from 'cheerio'
import qs from 'qs'
import randomize from 'randomatic'
import Base64 from 'base-64'
import Meteor, { createContainer } from 'react-native-meteor'

import providerConfigs from './provider-configs'

const styles = {
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  button: { backgroundColor: '#CCC', flex: -1 },
  buttonText: { textAlign: 'center', paddingVertical: 12, paddingHorizontal: 40 },
  text: { textAlign: 'center', marginBottom: 15 },
  view: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' }
}

class Login extends React.Component {
  static propTypes = {
    provider: React.PropTypes.string.isRequired,
    callbackUrl: React.PropTypes.string.isRequired,
    meteorServerDomain: React.PropTypes.string.isRequired,
    meteorServerProtocol: React.PropTypes.string.isRequired,
    clientId: React.PropTypes.string.isRequired,
    scope: React.PropTypes.string,
    url: React.PropTypes.string,
    Meteor: React.PropTypes.object,
    styles: React.PropTypes.object
  }

  static defaultProps = {
    styles: {}
  }

  styles = {
    buttonContainer: Object.assign({}, styles.buttonContainer, this.props.styles.buttonContainer),
    button: Object.assign({}, styles.button, this.props.styles.button),
    buttonText: Object.assign({}, styles.buttonText, this.props.styles.buttonText),
    text: Object.assign({}, styles.text, this.props.styles.text),
    view: Object.assign({}, styles.view, this.props.styles.view),  
  }

  state = {
    stage: 'initial',
    targetUrl: ''
  }

  login = () => {
    const providerConfig = providerConfigs[this.props.provider]
    const url = this.props.url || providerConfig.url
    const randomToken = randomize('*', 10)
    const state = stateParam('popup', randomToken, this.props.callbackUrl)
    const queryString = qs.stringify(Object.assign({
      client_id: this.props.clientId,
      redirect_uri: this.props.callbackUrl,
      scope: this.props.scope,
      state
    }, providerConfig.extraParams))
    this.setState({
      targetUrl: `${url}?${queryString}`,
      stage: 'webView'
    })
  }

  navigation = ({ url }) => {
    const regex = new RegExp(`^${this.props.callbackUrl}\[\?#](.*)$`)
    const parsedUrl = regex.exec(url)
    if (parsedUrl) {
      this.setState({ stage: 'confirmation' })
      const meteorUri = `${this.props.meteorServerProtocol}://${this.props.meteorServerDomain}/_oauth/${this.props.provider.toLowerCase()}?${parsedUrl[1]}`
      fetch(meteorUri)
        .then((res) => res.text())
        .then((text) => {
          let $ = cheerio.load(text)
          const config = JSON.parse($('#config').text())
          Meteor._login({ oauth: {
            credentialToken: config.credentialToken,
            credentialSecret: config.credentialSecret
          }}, (err, res) => {
            if (err) console.error('Error', err)
            this.setState({ stage: 'initial' })
          })
        })
        .catch((err) => {
          console.error('Error', err)
          this.setState({ stage: 'initial' })
        })
    }
  }

  renderStage = (stage, user) => {
    if (user) {
      return (<View style={this.styles.view}>
        <Text style={this.styles.text}>Logged in as {user.profile.name}.</Text>
        <View style={this.styles.buttonContainer}>
          <TouchableOpacity onPress={() => Meteor.logout()} style={this.styles.button}>
            <Text style={this.styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>)
    }

    return {
      initial: (
        <View style={this.styles.buttonContainer}>
          <TouchableOpacity onPress={this.login} style={this.styles.button}>
            <Text style={this.styles.buttonText}>Login with {this.props.provider}</Text>
          </TouchableOpacity>
        </View>),

      webView: (<WebView
        source={{uri: this.state.targetUrl}}
        onNavigationStateChange={this.navigation}
      />),

      confirmation: (<ActivityIndicator animating size='large' />)
    }[stage]
  }

  render () {
    return (
      <View style={this.styles.view}>
        {this.renderStage(this.state.stage, this.props.user)}
      </View>
    )
  }
}

function stateParam (loginStyle, credentialToken, redirectUrl) {
  var state = {
    loginStyle: loginStyle,
    credentialToken: credentialToken
  }
  if (loginStyle === 'redirect') state.redirectUrl = redirectUrl || null
  return Base64.encode(JSON.stringify(state))
}

export default createContainer((params) => {
  return {
    user: Meteor.user()
  }
}, Login)
